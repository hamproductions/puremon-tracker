import { useMemo, useState } from 'react';
import { FaArrowLeft, FaTableCells, FaUsers } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';
import { BromideTile } from '~/components/bromide/BromideTile';
import { ProgressBar, StatPills } from '~/components/bromide/Progress';
import type { Bromide, Catalog, Collection, Member } from '~/types';
import { buildGrid, collectionStats, memberMap } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';
import { formatReleaseDate, kindLabel, memberCountLabel } from './format';

interface CollectionDetailProps {
  catalog: Catalog;
  collection: Collection;
  ownership: Record<string, number>;
  mounted: boolean;
  toggle: (id: string) => void;
  setCount: (id: string, n: number) => void;
}

const CELL_MIN = '96px';

export function CollectionDetail({
  catalog,
  collection,
  ownership,
  mounted,
  toggle,
  setCount
}: CollectionDetailProps) {
  const [missingOnly, setMissingOnly] = useState(false);
  const [byMember, setByMember] = useState(false);
  const [size, setSize] = useState<string | undefined>(undefined);
  const grid = useMemo(() => buildGrid(catalog, collection, size), [catalog, collection, size]);
  const stats = collectionStats(catalog, collection.id, ownership);
  const sizeStats = collectionStats(catalog, collection.id, ownership, grid.size);
  const date = formatReleaseDate(collection.releaseDate);
  const isComplete = mounted && stats.percent === 100;

  const countOf = (id: string) => ownership[id] ?? 0;
  const shouldShow = (id?: string) => !missingOnly || !mounted || (id ? countOf(id) === 0 : true);

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
          <HStack gap="2" alignItems="center" flexWrap="wrap">
            <Badge
              size="sm"
              variant="subtle"
              colorPalette={collection.kind === 'member_grid' ? 'pink' : 'gray'}
            >
              {kindLabel(collection.kind)}
            </Badge>
            {isComplete ? (
              <Badge size="sm" variant="solid" colorPalette="green">
                コンプ!
              </Badge>
            ) : null}
          </HStack>
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
            <SegmentGroup.Root
              value={grid.size ?? ''}
              onValueChange={(e) => setSize(e.value)}
              size="sm"
              orientation="horizontal"
            >
              <SegmentGroup.Indicator />
              {grid.sizes.map((s) => (
                <SegmentGroup.Item key={s} value={s}>
                  <SegmentGroup.ItemText>{s}</SegmentGroup.ItemText>
                  <SegmentGroup.ItemControl />
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              ))}
            </SegmentGroup.Root>
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
        </HStack>
      </Stack>

      {grid.kind === 'member_grid' ? (
        byMember || grid.members.length <= 1 ? (
          <MemberSections
            ownership={ownership}
            toggle={toggle}
            setCount={setCount}
            shouldShow={shouldShow}
            grid={grid}
          />
        ) : (
          <MemberGridTable
            ownership={ownership}
            toggle={toggle}
            setCount={setCount}
            shouldShow={shouldShow}
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
        />
      )}
    </Stack>
  );
}

interface GridViewProps {
  ownership: Record<string, number>;
  toggle: (id: string) => void;
  setCount: (id: string, n: number) => void;
  shouldShow: (id?: string) => boolean;
}

interface MemberGridProps extends GridViewProps {
  grid: {
    members: Member[];
    numbers: number[];
    cell: (m: string, n: number) => Bromide | undefined;
  };
}

function MemberGridTable({ grid, ownership, toggle, setCount, shouldShow }: MemberGridProps) {
  const visibleNumbers = grid.numbers.filter((no) =>
    grid.members.some((m) => {
      const b = grid.cell(m.id, no);
      return b && shouldShow(b.id);
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
          gridTemplateColumns: `56px repeat(${grid.members.length}, minmax(${CELL_MIN}, 1fr))`
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
              {m.nickname}
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
              No.{no}
            </Center>
            {grid.members.map((m) => {
              const b = grid.cell(m.id, no);
              const hidden = b ? !shouldShow(b.id) : false;
              return (
                <Box
                  key={m.id}
                  borderColor="board.border"
                  borderTopWidth="1px"
                  borderLeftWidth="1px"
                  p="1.5"
                  opacity={hidden ? 0.15 : 1}
                  pointerEvents={hidden ? 'none' : undefined}
                >
                  {b ? (
                    <BromideTile
                      bromide={b}
                      member={m}
                      count={ownership[b.id] ?? 0}
                      onToggle={() => toggle(b.id)}
                      onSetCount={(n) => setCount(b.id, n)}
                      size="sm"
                    />
                  ) : (
                    <Box aspectRatio="3 / 4" borderRadius="lg" bgColor="bg.muted" opacity={0.3} />
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

function MemberSections({ grid, ownership, toggle, setCount, shouldShow }: MemberGridProps) {
  return (
    <Stack gap="4">
      {grid.members.map((m) => {
        const cells = grid.numbers
          .map((no) => grid.cell(m.id, no))
          .filter((b): b is Bromide => Boolean(b) && shouldShow(b?.id));
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
              <Text fontWeight="bold">{m.nickname}</Text>
              <Text color="fg.subtle" fontSize="xs">
                {m.name}
              </Text>
            </HStack>
            <Grid gap="3" gridTemplateColumns="repeat(auto-fill, minmax(80px, 1fr))">
              {cells.map((b) => (
                <Stack key={b.id} gap="1.5">
                  <BromideTile
                    bromide={b}
                    member={m}
                    count={ownership[b.id] ?? 0}
                    onToggle={() => toggle(b.id)}
                    onSetCount={(n) => setCount(b.id, n)}
                    label={`No.${b.no}`}
                    size="md"
                    showStepper
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
}

function FlatGridView({
  catalog,
  bromides,
  ownership,
  toggle,
  setCount,
  shouldShow
}: FlatGridProps) {
  const visible = bromides.filter((b) => shouldShow(b.id));
  const mm = memberMap(catalog);
  if (visible.length === 0) {
    return (
      <Center
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        py="12"
        bgColor="board.panel"
      >
        <Text color="fg.muted" fontSize="sm">
          表示するブロマイドがありません
        </Text>
      </Center>
    );
  }
  return (
    <Grid gap="3" gridTemplateColumns="repeat(auto-fill, minmax(90px, 1fr))">
      {visible.map((b) => {
        const member = b.memberId ? (mm.get(b.memberId) ?? null) : null;
        return (
          <Stack key={b.id} gap="1.5">
            <BromideTile
              bromide={b}
              member={member}
              count={ownership[b.id] ?? 0}
              onToggle={() => toggle(b.id)}
              onSetCount={(n) => setCount(b.id, n)}
              label={member ? `${member.nickname} No.${b.no}` : `No.${b.no}`}
              size="md"
              showStepper
            />
          </Stack>
        );
      })}
    </Grid>
  );
}
