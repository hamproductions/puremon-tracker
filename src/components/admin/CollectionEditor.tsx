import { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaPenToSquare, FaPlus, FaTrash, FaXmark } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Heading } from '~/components/ui/heading';
import { Input } from '~/components/ui/input';
import { NumberInput } from '~/components/ui/number-input';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { useToaster } from '~/context/ToasterContext';
import { catalogActions } from '~/hooks/useCatalog';
import { seedCatalog } from '~/data/catalog';
import type { BromideSpec, Catalog, Collection, CollectionKind, Member } from '~/types';

const SEED_IDS = new Set(seedCatalog.collections.map((c) => c.id));

const KIND_ITEMS: { value: CollectionKind; label: string }[] = [
  { value: 'member_grid', label: 'メンバー別' },
  { value: 'flat', label: '集合' },
  { value: 'mixed', label: '個別' }
];

const GROUP_VALUE = '__group__';

function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'collection';
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text as="label" color="fg.muted" fontSize="xs" fontWeight="bold">
      {children}
    </Text>
  );
}

interface FormState {
  title: string;
  description: string;
  releaseDate: string;
  kind: CollectionKind;
  memberIds: Set<string>;
  count: number;
  sizes: string;
  items: BromideSpec[];
  addMemberId: string | null;
  addNo: number;
}

function parseSizes(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function emptyForm(members: Member[]): FormState {
  return {
    title: '',
    description: '',
    releaseDate: '',
    kind: 'member_grid',
    memberIds: new Set(members.map((m) => m.id)),
    count: 3,
    sizes: '',
    items: [],
    addMemberId: members[0]?.id ?? null,
    addNo: 1
  };
}

export function CollectionEditor({ catalog }: { catalog: Catalog }) {
  const { toast } = useToaster();
  const [editing, setEditing] = useState<Collection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(catalog.members));

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? '',
        releaseDate: editing.releaseDate ?? '',
        kind: editing.kind,
        memberIds: new Set(
          editing.memberIds.length ? editing.memberIds : catalog.members.map((m) => m.id)
        ),
        count: editing.numbers.length || 1,
        sizes: (editing.sizes ?? []).join(', '),
        items: (editing.items ?? []).map((it) => ({ memberId: it.memberId, no: it.no })),
        addMemberId: catalog.members[0]?.id ?? null,
        addNo: 1
      });
    } else {
      setForm(emptyForm(catalog.members));
    }
  }, [editing, catalog.members]);

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));

  const toggleMember = (id: string) =>
    setForm((prev) => {
      const next = new Set(prev.memberIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, memberIds: next };
    });

  const selectedMembers = useMemo(
    () => catalog.members.filter((m) => form.memberIds.has(m.id)),
    [catalog.members, form.memberIds]
  );

  const addItem = () => {
    setForm((prev) => {
      const exists = prev.items.some(
        (it) => it.memberId === prev.addMemberId && it.no === prev.addNo
      );
      if (exists) {
        toast({ title: 'すでに追加済みです', type: 'error' });
        return prev;
      }
      return {
        ...prev,
        items: [...prev.items, { memberId: prev.addMemberId, no: prev.addNo }]
      };
    });
  };

  const removeItem = (index: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const canSave =
    form.title.trim().length > 0 &&
    (form.kind === 'mixed'
      ? form.items.length > 0
      : form.count >= 1 && (form.kind === 'flat' || selectedMembers.length > 0));

  const save = () => {
    if (!canSave) return;
    const sizes = parseSizes(form.sizes);
    const base = {
      id: editing?.id ?? `${slugify(form.title)}-${Date.now().toString(36)}`,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      releaseDate: form.releaseDate || undefined,
      sizes: sizes.length > 0 ? sizes : undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString()
    };
    const collection: Collection =
      form.kind === 'mixed'
        ? {
            ...base,
            kind: 'mixed',
            memberIds: [],
            numbers: [],
            items: form.items.map((it) => ({ memberId: it.memberId, no: it.no }))
          }
        : {
            ...base,
            kind: form.kind,
            memberIds: form.kind === 'flat' ? [] : selectedMembers.map((m) => m.id),
            numbers: Array.from({ length: form.count }, (_, i) => i + 1)
          };
    catalogActions.upsertCollection(collection);
    toast({ title: editing ? '更新しました' : '作成しました', type: 'success' });
    setEditing(null);
    setForm(emptyForm(catalog.members));
  };

  const remove = (c: Collection) => {
    catalogActions.deleteCollection(c.id);
    if (editing?.id === c.id) setEditing(null);
    toast({ title: '削除しました', type: 'success' });
  };

  const confirmDelete = () => {
    if (pendingDelete) remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <Grid gap="6" columns={{ base: 1, lg: 2 }}>
      <Stack
        gap="4"
        borderColor="board.border"
        borderRadius="xl"
        borderWidth="1px"
        p="4"
        bgColor="board.panel"
      >
        <HStack justifyContent="space-between" alignItems="center">
          <Heading fontSize="md">{editing ? 'コレクションを編集' : '新規コレクション'}</Heading>
          {editing ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
              新規作成へ
            </Button>
          ) : null}
        </HStack>

        <Stack gap="1.5">
          <FieldLabel>タイトル</FieldLabel>
          <Input
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="2025 夏フェス ブロマイド"
          />
        </Stack>

        <Stack gap="1.5">
          <FieldLabel>説明</FieldLabel>
          <Textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="会場限定ランダムブロマイド（全○種）"
            rows={2}
            outline="none"
            borderColor="border.default"
            borderRadius="l2"
            borderWidth="1px"
            py="2"
            px="3"
          />
        </Stack>

        <Grid gap="3" columns={{ base: 1, sm: 2 }}>
          <Stack gap="1.5">
            <FieldLabel>発売日</FieldLabel>
            <Input
              type="date"
              value={form.releaseDate}
              onChange={(e) => patch({ releaseDate: e.target.value })}
            />
          </Stack>
          {form.kind === 'mixed' ? null : (
            <Stack gap="1.5">
              <FieldLabel>種類数</FieldLabel>
              <NumberInput
                value={String(form.count)}
                min={1}
                max={99}
                onValueChange={(e) =>
                  patch({ count: Math.max(1, Math.round(e.valueAsNumber || 1)) })
                }
              />
            </Stack>
          )}
        </Grid>

        <Stack gap="1.5">
          <FieldLabel>種別</FieldLabel>
          <SegmentGroup.Root
            value={form.kind}
            onValueChange={(e) => patch({ kind: e.value as CollectionKind })}
            size="sm"
          >
            <SegmentGroup.Indicator />
            {KIND_ITEMS.map((item) => (
              <SegmentGroup.Item key={item.value} value={item.value}>
                <SegmentGroup.ItemText>{item.label}</SegmentGroup.ItemText>
                <SegmentGroup.ItemControl />
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            ))}
          </SegmentGroup.Root>
        </Stack>

        <Stack gap="1.5">
          <FieldLabel>サイズ（カンマ区切り・空欄で無し）</FieldLabel>
          <Input
            value={form.sizes}
            onChange={(e) => patch({ sizes: e.target.value })}
            placeholder="L, 2L"
          />
        </Stack>

        {form.kind === 'member_grid' ? (
          <Stack gap="1.5">
            <FieldLabel>メンバー選択</FieldLabel>
            <Wrap gap="1.5">
              {catalog.members.map((m) => {
                const active = form.memberIds.has(m.id);
                return (
                  <HStack
                    as="button"
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    style={
                      active
                        ? { backgroundColor: m.color, borderColor: m.color, color: '#ffffff' }
                        : undefined
                    }
                    cursor="pointer"
                    gap="1.5"
                    borderColor={active ? undefined : 'board.border'}
                    borderRadius="full"
                    borderWidth="1px"
                    py="1"
                    px="2.5"
                    bgColor={active ? undefined : 'board.panel'}
                    opacity={active ? 1 : 0.65}
                    transition="all 0.12s"
                    _hover={{ opacity: 1 }}
                  >
                    {active ? (
                      <FaCheck size={9} />
                    ) : (
                      <Box
                        style={{ backgroundColor: m.color }}
                        borderRadius="full"
                        w="2.5"
                        h="2.5"
                      />
                    )}
                    <Text fontSize="xs" fontWeight="medium">
                      {m.name}
                    </Text>
                  </HStack>
                );
              })}
            </Wrap>
          </Stack>
        ) : null}

        {form.kind === 'mixed' ? (
          <Stack gap="2.5">
            <FieldLabel>個別アイテム</FieldLabel>
            <Wrap gap="1.5">
              {catalog.members.map((m) => {
                const active = form.addMemberId === m.id;
                return (
                  <HStack
                    as="button"
                    key={m.id}
                    onClick={() => patch({ addMemberId: m.id })}
                    style={
                      active
                        ? { backgroundColor: m.color, borderColor: m.color, color: '#ffffff' }
                        : undefined
                    }
                    cursor="pointer"
                    gap="1.5"
                    borderColor={active ? undefined : 'board.border'}
                    borderRadius="full"
                    borderWidth="1px"
                    py="1"
                    px="2.5"
                    bgColor={active ? undefined : 'board.panel'}
                    opacity={active ? 1 : 0.65}
                    transition="all 0.12s"
                    _hover={{ opacity: 1 }}
                  >
                    <Box style={{ backgroundColor: m.color }} borderRadius="full" w="2.5" h="2.5" />
                    <Text fontSize="xs" fontWeight="medium">
                      {m.name}
                    </Text>
                  </HStack>
                );
              })}
              <HStack
                as="button"
                onClick={() => patch({ addMemberId: null })}
                style={
                  form.addMemberId === null
                    ? { backgroundColor: '#FF5FA2', borderColor: '#FF5FA2', color: '#ffffff' }
                    : undefined
                }
                cursor="pointer"
                gap="1.5"
                borderColor={form.addMemberId === null ? undefined : 'board.border'}
                borderRadius="full"
                borderWidth="1px"
                py="1"
                px="2.5"
                bgColor={form.addMemberId === null ? undefined : 'board.panel'}
                opacity={form.addMemberId === null ? 1 : 0.65}
                transition="all 0.12s"
                _hover={{ opacity: 1 }}
              >
                <Text fontSize="xs" fontWeight="medium">
                  集合
                </Text>
              </HStack>
            </Wrap>
            <HStack gap="2" alignItems="end">
              <Stack flex="1" gap="1.5">
                <FieldLabel>No.</FieldLabel>
                <NumberInput
                  value={String(form.addNo)}
                  min={1}
                  max={99}
                  onValueChange={(e) =>
                    patch({ addNo: Math.max(1, Math.round(e.valueAsNumber || 1)) })
                  }
                />
              </Stack>
              <Button variant="outline" onClick={addItem}>
                <FaPlus />
                追加
              </Button>
            </HStack>

            {form.items.length > 0 ? (
              <Stack gap="1.5">
                {form.items.map((it, i) => {
                  const m = it.memberId
                    ? catalog.members.find((x) => x.id === it.memberId)
                    : undefined;
                  const color = m?.color ?? '#FF5FA2';
                  return (
                    <HStack
                      key={`${it.memberId ?? GROUP_VALUE}:${it.no}`}
                      gap="2"
                      borderColor="board.border"
                      borderRadius="lg"
                      borderWidth="1px"
                      py="1.5"
                      px="2.5"
                      bgColor="board.panel"
                    >
                      <Box
                        style={{ backgroundColor: color }}
                        flexShrink="0"
                        borderRadius="full"
                        w="2.5"
                        h="2.5"
                      />
                      <Text flex="1" fontSize="sm" fontWeight="medium" truncate>
                        {m ? m.name : '集合'}
                      </Text>
                      <Text color="fg.muted" fontSize="xs" fontWeight="bold">
                        No.{it.no}
                      </Text>
                      <Box
                        as="button"
                        aria-label="削除"
                        onClick={() => removeItem(i)}
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        color="fg.muted"
                        _hover={{ color: 'red.10' }}
                      >
                        <FaXmark size={12} />
                      </Box>
                    </HStack>
                  );
                })}
              </Stack>
            ) : (
              <Text color="fg.subtle" fontSize="xs">
                メンバーまたは集合を選び、No. を入力して追加してください
              </Text>
            )}
          </Stack>
        ) : null}

        <Button onClick={save} disabled={!canSave}>
          {editing ? <FaCheck /> : <FaPlus />}
          {editing ? '更新する' : '作成する'}
        </Button>
      </Stack>

      <Stack gap="2">
        <Heading fontSize="md">コレクション一覧</Heading>
        <Stack gap="2">
          {catalog.collections.map((c) => {
            const custom = !SEED_IDS.has(c.id);
            const canDelete = true;
            return (
              <HStack
                key={c.id}
                gap="3"
                borderColor={editing?.id === c.id ? 'accent.default' : 'board.border'}
                borderRadius="lg"
                borderWidth="1px"
                p="3"
                bgColor="board.panel"
              >
                <Stack flex="1" gap="1" minW="0">
                  <HStack gap="2" flexWrap="wrap">
                    <Text fontSize="sm" fontWeight="bold" truncate>
                      {c.title}
                    </Text>
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette={
                        c.kind === 'member_grid' ? 'pink' : c.kind === 'mixed' ? 'red' : 'gray'
                      }
                    >
                      {c.kind === 'member_grid'
                        ? 'メンバー別'
                        : c.kind === 'mixed'
                          ? '個別'
                          : '集合'}
                    </Badge>
                    {custom ? (
                      <Badge size="sm" variant="outline" colorPalette="amber">
                        カスタム
                      </Badge>
                    ) : null}
                  </HStack>
                  <Text color="fg.muted" fontSize="xs">
                    {c.kind === 'mixed'
                      ? `${c.items?.length ?? 0}種（個別）`
                      : `${c.numbers.length}種${c.kind === 'member_grid' ? ` × ${c.memberIds.length}名` : ''}`}
                  </Text>
                </Stack>
                <HStack gap="1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                    <FaPenToSquare />
                    編集
                  </Button>
                  {canDelete ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete(c)}
                      colorPalette="red"
                    >
                      <FaTrash />
                      削除
                    </Button>
                  ) : null}
                </HStack>
              </HStack>
            );
          })}
        </Stack>
      </Stack>

      <Dialog.Root
        open={pendingDelete !== null}
        onOpenChange={(e) => {
          if (!e.open) setPendingDelete(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="sm" p="6">
            <Stack gap="4">
              <Stack gap="1">
                <Dialog.Title asChild>
                  <Heading fontSize="lg">コレクションを削除しますか？</Heading>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <Text color="fg.muted" fontSize="sm">
                    「{pendingDelete?.title}」を削除します。この操作は取り消せません。
                  </Text>
                </Dialog.Description>
              </Stack>
              <HStack gap="2" justifyContent="flex-end">
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline">キャンセル</Button>
                </Dialog.CloseTrigger>
                <Button onClick={confirmDelete} colorPalette="red">
                  <FaTrash />
                  削除する
                </Button>
              </HStack>
            </Stack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Grid>
  );
}
