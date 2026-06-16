import { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaCheck,
  FaGear,
  FaPenToSquare,
  FaPlus,
  FaTableCells,
  FaUsers
} from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, Wrap, styled } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';
import { BromideTile } from '~/components/bromide/BromideTile';
import { ProgressBar, StatPills } from '~/components/bromide/Progress';
import { PhotoAddDialog } from '~/components/photo/PhotoAddDialog';
import { buildStableSlots } from '~/components/admin/CollectionEditor';
import { deleteBromideImage } from '~/lib/storage';
import { useToaster } from '~/context/ToasterContext';
import { useAuth } from '~/hooks/useAuth';
import { catalogActions } from '~/hooks/useCatalog';
import { useUserPreference } from '~/hooks/useUserPreference';
import type { Bromide, Catalog, Collection, Member } from '~/types';
import { DEFAULT_BROMIDE_ASPECT, bromideAspectRatio } from '~/utils/aspect';
import { bromideCount, buildGrid, collectionStats, memberMap, slotLabel } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';
import { formatReleaseDate, memberCountLabel } from './format';

interface CollectionDetailProps {
  catalog: Catalog;
  collection: Collection;
  ownership: Record<string, number>;
  mounted: boolean;
  toggle: (id: string) => void;
  setCount: (id: string, n: number) => void;
}

const GRID_SIZE_PRESETS = [
  { label: '小', value: 84 },
  { label: '中', value: 116 },
  { label: '大', value: 156 }
];

interface CollectionViewPreference {
  missingOnly: boolean;
  byMember: boolean;
  size?: string;
  gridCellMin: number;
}

export function CollectionDetail({
  catalog,
  collection,
  ownership,
  mounted,
  toggle,
  setCount
}: CollectionDetailProps) {
  const { isAdmin, profile } = useAuth();
  const { toast } = useToaster();
  const defaultView = useMemo<CollectionViewPreference>(
    () => ({
      missingOnly: false,
      byMember: false,
      size: undefined,
      gridCellMin: collection.kind === 'mixed' ? 148 : 116
    }),
    [collection.kind]
  );
  const [view, setView] = useUserPreference(`collection-view:${collection.id}`, defaultView);
  const [byMemberAuto, setByMemberAuto] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoTargetId, setPhotoTargetId] = useState<string | null>(null);
  const missingOnly = view.missingOnly;
  const byMember = view.byMember;
  const gridCellMin = view.gridCellMin;
  const grid = useMemo(
    () => buildGrid(catalog, collection, view.size),
    [catalog, collection, view.size]
  );
  const setMissingOnly = (missingOnly: boolean) => setView((prev) => ({ ...prev, missingOnly }));
  const setByMember = (byMember: boolean) => setView((prev) => ({ ...prev, byMember }));
  const setSize = (size: string) => setView((prev) => ({ ...prev, size }));
  const setGridCellMin = (gridCellMin: number) => setView((prev) => ({ ...prev, gridCellMin }));
  const directImageEdit = isAdmin;

  const requestImage = (bromideId: string) => {
    if (!profile) {
      toast({
        title: directImageEdit
          ? '画像登録にはログインが必要です'
          : '画像投稿にはログインが必要です',
        type: 'error'
      });
      return;
    }
    setPhotoTargetId(bromideId);
    setPhotoOpen(true);
  };

  const adminEdit = isAdmin && editMode;
  const isMixed = collection.kind === 'mixed';
  const [editTarget, setEditTarget] = useState<{ mode: 'retag' | 'add'; bromide?: Bromide } | null>(
    null
  );
  const [addNo, setAddNo] = useState(1);
  const [addType, setAddType] = useState('');

  const updateItems = (
    items: { memberId: string | null; no: number; type?: string; label?: string }[]
  ) => {
    const next = { ...collection, items };
    void catalogActions.upsertCollection({ ...next, slots: buildStableSlots(next, collection) });
  };
  const retagItem = (target: Bromide, memberId: string | null) => {
    if (memberId === target.memberId) return;
    const clash = (collection.items ?? []).some(
      (it) => it.memberId === memberId && it.no === target.no && it.type === target.type
    );
    if (clash) {
      toast({ title: 'そのタグの画像はすでにあります', type: 'error' });
      return;
    }
    updateItems(
      (collection.items ?? []).map((it) =>
        it.memberId === target.memberId && it.no === target.no && it.type === target.type
          ? { memberId, no: it.no, type: it.type, label: it.label }
          : it
      )
    );
    toast({ title: 'メンバーを変更しました', type: 'success' });
  };
  const removeItem = (target: Bromide) => {
    updateItems(
      (collection.items ?? []).filter(
        (it) => !(it.memberId === target.memberId && it.no === target.no && it.type === target.type)
      )
    );
    toast({ title: 'カードを削除しました', type: 'success' });
  };
  const addItem = (memberId: string | null, no: number, type?: string) => {
    if (
      (collection.items ?? []).some(
        (it) => it.memberId === memberId && it.no === no && it.type === type
      )
    ) {
      toast({ title: 'すでに追加済みです', type: 'error' });
      return;
    }
    updateItems([...(collection.items ?? []), { memberId, no, type }]);
    toast({ title: 'カードを追加しました', type: 'success' });
  };
  const removeImage = async (target: Bromide) => {
    const saved = await catalogActions.setBromideImage(target.id, null);
    if (saved) await deleteBromideImage(target.imageUrl);
    toast({
      title: saved ? '画像を削除しました' : '画像の削除に失敗しました',
      type: saved ? 'success' : 'error'
    });
  };

  useEffect(() => {
    if (byMemberAuto) return;
    setByMemberAuto(true);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches) {
      setByMember(true);
    }
  }, [byMemberAuto]);
  const stats = collectionStats(catalog, collection.id, ownership);
  const sizeStats = collectionStats(catalog, collection.id, ownership, grid.size);
  const date = formatReleaseDate(collection.releaseDate);
  const isComplete = mounted && stats.percent === 100;

  const countOf = (bromide: Bromide) => bromideCount(ownership, bromide);
  const shouldShow = (bromide?: Bromide) =>
    !missingOnly || !mounted || (bromide ? countOf(bromide) === 0 : true);

  const memberVisible =
    grid.kind !== 'member_grid' ||
    grid.numbers.some((no) =>
      grid.members.some((m) => {
        const b = grid.cell(m.id, no);
        return b ? shouldShow(b) : false;
      })
    );

  return (
    <Stack gap="5">
      <Stack gap="3">
        <Link
          href={toAppUrl('/collections')}
          display="inline-flex"
          gap="1.5"
          alignItems="center"
          w="fit-content"
          color="fg.muted"
          fontSize="sm"
          _hover={{ color: 'accent.text', textDecoration: 'none' }}
        >
          <FaArrowLeft size={12} />
          コレクション一覧
        </Link>

        <Stack gap="2">
          <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <HStack gap="2" alignItems="center" flexWrap="wrap">
              {isComplete ? (
                <Badge size="sm" variant="solid" colorPalette="green">
                  コンプ!
                </Badge>
              ) : null}
            </HStack>
            <HStack gap="1.5" flexWrap="wrap">
              <Button
                size="xs"
                variant="solid"
                onClick={() => {
                  if (!profile) {
                    toast({
                      title: adminEdit
                        ? '画像登録にはログインが必要です'
                        : '画像投稿にはログインが必要です',
                      type: 'error'
                    });
                    return;
                  }
                  setPhotoTargetId(null);
                  setPhotoOpen(true);
                }}
                colorPalette="accent"
              >
                <FaPlus />
                画像を追加
              </Button>
              {isAdmin ? (
                <>
                  <Button asChild size="xs" variant="outline">
                    <Link href={toAppUrl(`/admin?collection=${collection.id}`)}>
                      <FaGear />
                      コレクション編集
                    </Link>
                  </Button>
                  <Button
                    size="xs"
                    variant={editMode ? 'solid' : 'outline'}
                    onClick={() => setEditMode((v) => !v)}
                  >
                    {editMode ? <FaCheck /> : <FaPenToSquare />}
                    {editMode ? '画像管理を終了' : '画像を管理'}
                  </Button>
                </>
              ) : null}
            </HStack>
          </HStack>
          {adminEdit ? (
            <Text color="accent.text" fontSize="xs">
              画像ボタンで登録・差し替え、ゴミ箱で画像削除できます。
              {isMixed
                ? ' カード本体タップでタグ変更、× でカード削除、末尾の「＋」で追加できます。'
                : ''}
            </Text>
          ) : null}
          <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.15">
            {collection.title}
          </Heading>
          {collection.description ? (
            <Text color="fg.muted" fontSize="sm">
              {collection.description}
            </Text>
          ) : null}
          <HStack gap="3" color="fg.subtle" fontSize="xs" flexWrap="wrap">
            {date ? <Text fontSize="xs">{date}</Text> : null}
            <Text fontSize="xs">{memberCountLabel(collection)}</Text>
            <Text fontSize="xs">全 {stats.total} 枚</Text>
          </HStack>
        </Stack>
      </Stack>

      <Stack
        gap="3"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p={{ base: '3.5', md: '4' }}
        bgColor="board.panel"
        backdropFilter="blur(8px)"
      >
        <HStack gap="3" justifyContent="space-between" alignItems="baseline">
          <Text fontSize="sm" fontWeight="bold">
            進捗
          </Text>
          <Text color="fg.muted" fontSize="sm" fontVariantNumeric="tabular-nums">
            {mounted ? `${stats.owned} / ${stats.total} 枚` : `全 ${stats.total} 枚`}
          </Text>
        </HStack>
        <ProgressBar percent={mounted ? stats.percent : 0} />
        <StatPills stats={stats} mounted={mounted} />

        {grid.hasSizes ? (
          <HStack
            gap="2.5"
            alignItems="center"
            borderColor="board.border"
            borderTopWidth="1px"
            pt="2.5"
            flexWrap="wrap"
          >
            <Text fontSize="sm" fontWeight="bold">
              サイズ
            </Text>
            <HStack gap="1" borderRadius="lg" p="1" bgColor="bg.muted">
              {grid.sizes.map((s) => {
                const active = grid.size === s;
                return (
                  <styled.button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={active}
                    cursor="pointer"
                    borderRadius="md"
                    minW="12"
                    py="1.5"
                    px="4"
                    color={active ? 'accent.fg' : 'fg.muted'}
                    fontSize="sm"
                    fontWeight="bold"
                    bgColor={active ? 'accent.default' : 'transparent'}
                    transition="background-color 0.12s, color 0.12s"
                    _hover={active ? undefined : { bgColor: 'bg.emphasized', color: 'fg.default' }}
                  >
                    {s}
                  </styled.button>
                );
              })}
            </HStack>
            {mounted ? (
              <Text color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
                {grid.size}サイズ {sizeStats.owned}/{sizeStats.total}・{sizeStats.percent}%
              </Text>
            ) : null}
          </HStack>
        ) : null}

        <HStack gap="4" borderColor="board.border" borderTopWidth="1px" pt="2.5" flexWrap="wrap">
          <Switch
            checked={missingOnly}
            onCheckedChange={(e) => setMissingOnly(e.checked)}
            size="sm"
          >
            <Text fontSize="sm">未所持のみ表示</Text>
          </Switch>
          {grid.kind === 'member_grid' && grid.members.length > 1 ? (
            <Switch checked={byMember} onCheckedChange={(e) => setByMember(e.checked)} size="sm">
              <HStack gap="1.5">
                {byMember ? <FaUsers size={12} /> : <FaTableCells size={12} />}
                <Text fontSize="sm">メンバー別</Text>
              </HStack>
            </Switch>
          ) : null}
          <HStack gap="2" alignItems="center" flexWrap="wrap">
            <Text fontSize="sm">カード幅</Text>
            <HStack gap="1" borderRadius="lg" p="1" bgColor="bg.muted">
              {GRID_SIZE_PRESETS.map((preset) => (
                <styled.button
                  key={preset.label}
                  type="button"
                  onClick={() => setGridCellMin(preset.value)}
                  aria-pressed={gridCellMin === preset.value}
                  cursor="pointer"
                  borderRadius="md"
                  minW="9"
                  py="1"
                  px="2.5"
                  color={gridCellMin === preset.value ? 'accent.fg' : 'fg.muted'}
                  fontSize="xs"
                  fontWeight="bold"
                  bgColor={gridCellMin === preset.value ? 'accent.default' : 'transparent'}
                  _hover={
                    gridCellMin === preset.value
                      ? undefined
                      : { bgColor: 'bg.emphasized', color: 'fg.default' }
                  }
                >
                  {preset.label}
                </styled.button>
              ))}
            </HStack>
            <styled.input
              type="range"
              min={72}
              max={200}
              step={4}
              value={gridCellMin}
              onChange={(e) => setGridCellMin(Number(e.target.value))}
              aria-label="カード幅"
              cursor="pointer"
              w={{ base: '120px', md: '160px' }}
              accentColor="accent.default"
            />
            <Text color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
              {gridCellMin}px
            </Text>
          </HStack>
        </HStack>
      </Stack>

      {grid.kind === 'member_grid' ? (
        !memberVisible ? (
          <EmptyState missingOnly={missingOnly} />
        ) : byMember || grid.members.length <= 1 ? (
          <MemberSections
            ownership={ownership}
            toggle={toggle}
            setCount={setCount}
            shouldShow={shouldShow}
            adminEdit={adminEdit}
            requestImage={requestImage}
            removeImage={removeImage}
            gridCellMin={gridCellMin}
            grid={grid}
          />
        ) : (
          <MemberGridTable
            ownership={ownership}
            toggle={toggle}
            setCount={setCount}
            shouldShow={shouldShow}
            adminEdit={adminEdit}
            requestImage={requestImage}
            removeImage={removeImage}
            gridCellMin={gridCellMin}
            grid={grid}
          />
        )
      ) : (
        <FlatGridView
          catalog={catalog}
          bromides={grid.bromides}
          ownership={ownership}
          toggle={toggle}
          setCount={setCount}
          shouldShow={shouldShow}
          adminEdit={adminEdit}
          requestImage={requestImage}
          removeImage={removeImage}
          gridCellMin={gridCellMin}
          onEditItem={
            adminEdit && isMixed ? (b) => setEditTarget({ mode: 'retag', bromide: b }) : undefined
          }
          onRemoveItem={adminEdit && isMixed ? removeItem : undefined}
          onAddCard={
            adminEdit && isMixed
              ? () => {
                  setAddNo(1);
                  setAddType('');
                  setEditTarget({ mode: 'add' });
                }
              : undefined
          }
        />
      )}

      <Dialog.Root
        open={editTarget !== null}
        onOpenChange={(e) => {
          if (!e.open) setEditTarget(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="sm" p="5">
            <Stack gap="4">
              <Dialog.Title asChild>
                <Heading fontSize="lg">
                  {editTarget?.mode === 'add' ? 'カードを追加' : 'メンバーを変更'}
                </Heading>
              </Dialog.Title>
              {editTarget?.mode === 'add' ? (
                <HStack gap="2" alignItems="center">
                  <Text fontSize="sm" fontWeight="bold">
                    管理番号
                  </Text>
                  <styled.input
                    type="number"
                    min={1}
                    value={addNo}
                    onChange={(e) => setAddNo(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    borderColor="border.default"
                    borderRadius="l2"
                    borderWidth="1px"
                    w="20"
                    py="1.5"
                    px="2.5"
                    fontSize="sm"
                  />
                </HStack>
              ) : null}
              {editTarget?.mode === 'add' ? (
                <Stack gap="1">
                  <Text fontSize="sm" fontWeight="bold">
                    タイプ / タグ
                  </Text>
                  <styled.input
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    placeholder="A, 引き, レア"
                    borderColor="border.default"
                    borderRadius="l2"
                    borderWidth="1px"
                    py="1.5"
                    px="2.5"
                    fontSize="sm"
                  />
                </Stack>
              ) : null}
              <Text color="fg.muted" fontSize="xs">
                メンバータグを選択してください
              </Text>
              <Wrap gap="1.5">
                {[...catalog.members, null].map((m) => {
                  const memberId = m?.id ?? null;
                  const color = m?.color ?? '#FF5FA2';
                  return (
                    <styled.button
                      key={memberId ?? '__group__'}
                      type="button"
                      onClick={() => {
                        if (editTarget?.mode === 'add')
                          addItem(memberId, addNo, addType.trim() || undefined);
                        else if (editTarget?.bromide) retagItem(editTarget.bromide, memberId);
                        setEditTarget(null);
                      }}
                      cursor="pointer"
                      display="inline-flex"
                      gap="1.5"
                      alignItems="center"
                      borderColor="board.border"
                      borderRadius="full"
                      borderWidth="1px"
                      py="1.5"
                      px="3"
                      fontSize="sm"
                      fontWeight="medium"
                      bgColor="board.panel"
                      _hover={{ borderColor: 'accent.default', bgColor: 'bg.muted' }}
                    >
                      <Box style={{ backgroundColor: color }} borderRadius="full" w="2.5" h="2.5" />
                      {m ? m.name : '集合'}
                    </styled.button>
                  );
                })}
              </Wrap>
              <HStack justifyContent="flex-end">
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline" size="sm">
                    閉じる
                  </Button>
                </Dialog.CloseTrigger>
              </HStack>
            </Stack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <PhotoAddDialog
        catalog={catalog}
        collection={collection}
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        initialTargetId={photoTargetId}
        adminEdit={directImageEdit}
      />
    </Stack>
  );
}

interface GridViewProps {
  ownership: Record<string, number>;
  toggle: (id: string) => void;
  setCount: (id: string, n: number) => void;
  shouldShow: (bromide?: Bromide) => boolean;
  adminEdit?: boolean;
  requestImage?: (id: string) => void;
  removeImage?: (b: Bromide) => void;
  gridCellMin: number;
}

interface MemberGridProps extends GridViewProps {
  grid: {
    members: Member[];
    numbers: number[];
    cell: (m: string, n: number) => Bromide | undefined;
  };
}

function MemberGridTable({
  grid,
  ownership,
  toggle,
  setCount,
  shouldShow,
  adminEdit,
  requestImage,
  removeImage,
  gridCellMin
}: MemberGridProps) {
  const visibleNumbers = grid.numbers.filter((no) =>
    grid.members.some((m) => {
      const b = grid.cell(m.id, no);
      return b && shouldShow(b);
    })
  );

  return (
    <Box
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      bgColor="board.panelSolid"
      overflowX="auto"
    >
      <Box
        style={{
          gridTemplateColumns: `56px repeat(${grid.members.length}, minmax(${gridCellMin + 24}px, 1fr))`
        }}
        display="grid"
        minW="fit-content"
      >
        <Box
          zIndex="2"
          position="sticky"
          left="0"
          borderColor="board.border"
          borderRightWidth="1px"
          borderBottomWidth="1px"
          bgColor="board.panelSolid"
        />
        {grid.members.map((m) => (
          <HStack
            key={m.id}
            zIndex="1"
            position="sticky"
            top="0"
            gap="1.5"
            justifyContent="center"
            alignItems="center"
            borderColor="board.border"
            borderBottomWidth="1px"
            py="2.5"
            px="1.5"
            bgColor="board.panelSolid"
          >
            <Box
              style={{ backgroundColor: m.color }}
              flexShrink="0"
              borderRadius="full"
              w="2.5"
              h="2.5"
            />
            <Text fontSize="xs" fontWeight="bold" truncate>
              {m.name}
            </Text>
          </HStack>
        ))}

        {visibleNumbers.map((no) => (
          <Box key={no} display="contents">
            <Center
              zIndex="1"
              position="sticky"
              left="0"
              borderColor="board.border"
              borderTopWidth="1px"
              borderRightWidth="1px"
              color="fg.muted"
              fontSize="xs"
              fontWeight="bold"
              bgColor="board.panelSolid"
            >
              {String(no)}
            </Center>
            {grid.members.map((m) => {
              const b = grid.cell(m.id, no);
              const show = b ? shouldShow(b) : false;
              return (
                <Box
                  key={m.id}
                  borderColor="board.border"
                  borderTopWidth="1px"
                  borderLeftWidth="1px"
                  p="1.5"
                >
                  {b && show ? (
                    <BromideTile
                      bromide={b}
                      member={m}
                      count={bromideCount(ownership, b)}
                      onToggle={() => toggle(b.id)}
                      onSetCount={(n) => setCount(b.id, n)}
                      size="sm"
                      adminEdit={adminEdit}
                      onAddImage={requestImage ? () => requestImage(b.id) : undefined}
                      onRemoveImage={removeImage ? () => removeImage(b) : undefined}
                    />
                  ) : (
                    <Box
                      style={{
                        aspectRatio: b ? bromideAspectRatio(b) : `${DEFAULT_BROMIDE_ASPECT} / 1`
                      }}
                      borderRadius="lg"
                      bgColor="bg.muted"
                      opacity={0.3}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Center(props: React.ComponentProps<typeof styled.div>) {
  return <styled.div display="flex" justifyContent="center" alignItems="center" {...props} />;
}

function EmptyState({ missingOnly }: { missingOnly: boolean }) {
  return (
    <Center
      gap="1"
      flexDirection="column"
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      py="12"
      px="4"
      bgColor="board.panel"
    >
      <Text fontWeight="bold">
        {missingOnly ? '未所持なし — コンプ達成！🎉' : '表示するブロマイドがありません'}
      </Text>
      {missingOnly ? (
        <Text color="fg.muted" fontSize="sm">
          このサイズはすべて揃っています
        </Text>
      ) : null}
    </Center>
  );
}

function MemberSections({
  grid,
  ownership,
  toggle,
  setCount,
  shouldShow,
  adminEdit,
  requestImage,
  removeImage,
  gridCellMin
}: MemberGridProps) {
  return (
    <Stack gap="4">
      {grid.members.map((m) => {
        const cells = grid.numbers
          .map((no) => grid.cell(m.id, no))
          .filter((b): b is Bromide => Boolean(b) && shouldShow(b));
        if (cells.length === 0) return null;
        return (
          <Stack
            key={m.id}
            gap="3"
            borderColor="board.border"
            borderRadius="2xl"
            borderWidth="1px"
            p="3.5"
            bgColor="board.panelSolid"
          >
            <HStack gap="2" alignItems="center">
              <Box style={{ backgroundColor: m.color }} borderRadius="full" w="3" h="3" />
              <Text fontWeight="bold">{m.name}</Text>
            </HStack>
            <Grid
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${gridCellMin}px, 1fr))`
              }}
              gap="3"
            >
              {cells.map((b) => (
                <Stack key={b.id} gap="1.5">
                  <BromideTile
                    bromide={b}
                    member={m}
                    count={bromideCount(ownership, b)}
                    onToggle={() => toggle(b.id)}
                    onSetCount={(n) => setCount(b.id, n)}
                    label={slotLabel(b)}
                    size="md"
                    showStepper
                    adminEdit={adminEdit}
                    onAddImage={requestImage ? () => requestImage(b.id) : undefined}
                    onRemoveImage={removeImage ? () => removeImage(b) : undefined}
                  />
                </Stack>
              ))}
            </Grid>
          </Stack>
        );
      })}
    </Stack>
  );
}

interface FlatGridProps extends GridViewProps {
  catalog: Catalog;
  bromides: Bromide[];
  onEditItem?: (b: Bromide) => void;
  onRemoveItem?: (b: Bromide) => void;
  onAddCard?: () => void;
}

function FlatGridView({
  catalog,
  bromides,
  ownership,
  toggle,
  setCount,
  shouldShow,
  adminEdit,
  requestImage,
  removeImage,
  gridCellMin,
  onEditItem,
  onRemoveItem,
  onAddCard
}: FlatGridProps) {
  const visible = adminEdit ? bromides : bromides.filter((b) => shouldShow(b));
  const mm = memberMap(catalog);
  if (visible.length === 0 && !onAddCard) {
    return <EmptyState missingOnly={bromides.length > 0} />;
  }
  return (
    <Grid
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${gridCellMin}px, 1fr))`
      }}
      gap="3"
    >
      {visible.map((b) => {
        const member = b.memberId ? (mm.get(b.memberId) ?? null) : null;
        return (
          <Stack key={b.id} gap="1.5">
            <BromideTile
              bromide={b}
              member={member}
              count={bromideCount(ownership, b)}
              onToggle={() => toggle(b.id)}
              onSetCount={(n) => setCount(b.id, n)}
              label={member ? `${member.name} ${slotLabel(b)}` : `集合 ${slotLabel(b)}`}
              size="md"
              showStepper
              adminEdit={adminEdit}
              onAddImage={requestImage ? () => requestImage(b.id) : undefined}
              onRemoveImage={removeImage ? () => removeImage(b) : undefined}
              onEditMember={onEditItem ? () => onEditItem(b) : undefined}
              onRemoveCard={onRemoveItem ? () => onRemoveItem(b) : undefined}
            />
          </Stack>
        );
      })}
      {onAddCard ? (
        <styled.button
          type="button"
          onClick={onAddCard}
          aria-label="カードを追加"
          cursor="pointer"
          display="flex"
          gap="1"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          aspectRatio={String(DEFAULT_BROMIDE_ASPECT)}
          borderColor="board.border"
          borderRadius="lg"
          borderWidth="2px"
          color="fg.muted"
          bgColor="board.missing"
          borderStyle="dashed"
          _hover={{ borderColor: 'accent.default', color: 'accent.text' }}
        >
          <FaPlus size={18} />
          <styled.span fontSize="2xs" fontWeight="bold">
            カード追加
          </styled.span>
        </styled.button>
      ) : null}
    </Grid>
  );
}
