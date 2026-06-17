import { useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaPenToSquare, FaPlus, FaTrash } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, Wrap, styled } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Heading } from '~/components/ui/heading';
import { Input } from '~/components/ui/input';
import { NumberInput } from '~/components/ui/number-input';
import { Table } from '~/components/ui/table';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { useToaster } from '~/context/ToasterContext';
import { catalogActions } from '~/hooks/useCatalog';
import { bromideId, buildBromides, collectionSizes, seedCatalog } from '~/data/catalog';
import { formatReleaseDate, memberCountLabel } from '~/components/collection/format';
import type { Bromide, BromideSpec, Catalog, Collection, CollectionKind, Member } from '~/types';
import { DEFAULT_BROMIDE_ASPECT, LANDSCAPE_BROMIDE_ASPECT } from '~/utils/aspect';

const SEED_IDS = new Set(seedCatalog.collections.map((c) => c.id));

const LANDSCAPE_ASPECT = LANDSCAPE_BROMIDE_ASPECT;

const PRESETS: { value: CollectionKind; label: string }[] = [
  { value: 'member_grid', label: 'メンバー別' },
  { value: 'flat', label: '番号だけ' },
  { value: 'mixed', label: '自由' }
];

const GROUP_VALUE = '__group__';

function isLandscape(aspect?: number): boolean {
  return Math.abs((aspect ?? DEFAULT_BROMIDE_ASPECT) - LANDSCAPE_ASPECT) < 0.001;
}

function newSlotId(collectionId: string): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${collectionId}:slot:${id}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

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
  seedL: boolean;
  seed2L: boolean;
  seedLandscape: boolean;
  items: BromideSpec[];
}

function emptyForm(members: Member[]): FormState {
  return {
    title: '',
    description: '',
    releaseDate: '',
    kind: 'member_grid',
    memberIds: new Set(members.map((m) => m.id)),
    count: 10,
    seedL: true,
    seed2L: false,
    seedLandscape: false,
    items: []
  };
}

export function buildStableSlots(
  collection: Collection,
  previous: Collection | null,
  aspect?: number
): BromideSpec[] {
  const previousByLegacy = new Map<string, { id: string; legacyIds: string[] }>();
  if (previous) {
    for (const b of buildBromides(previous)) {
      previousByLegacy.set(b.id, { id: b.id, legacyIds: b.legacyIds });
      for (const legacyId of b.legacyIds) previousByLegacy.set(legacyId, b);
    }
  }

  const specs: BromideSpec[] =
    collection.kind === 'mixed'
      ? collectionSizes(collection).flatMap((size) =>
          (collection.items ?? []).map((it) => ({ ...it, size }))
        )
      : collectionSizes(collection).flatMap((size) =>
          (collection.kind === 'flat' ? [null] : collection.memberIds).flatMap((memberId) =>
            collection.numbers.map((no) => ({ memberId, size, no, aspect }))
          )
        );

  return specs.map((spec) => {
    const legacyId = bromideId(collection.id, spec.memberId, spec.no, spec.size ?? null, spec.type);
    const previousSlot = previousByLegacy.get(legacyId);
    const slotId = previousSlot?.id ?? newSlotId(collection.id);
    return {
      ...spec,
      slotId,
      legacyIds: unique([legacyId, ...(previousSlot?.legacyIds ?? [])]).filter(
        (id) => id !== slotId
      )
    };
  });
}

export function buildSlotsFromItems(
  collectionId: string,
  items: BromideSpec[],
  previous: Collection | null
): BromideSpec[] {
  const previousByLegacy = new Map<string, { id: string; legacyIds: string[] }>();
  if (previous) {
    for (const b of buildBromides(previous)) {
      previousByLegacy.set(b.id, { id: b.id, legacyIds: b.legacyIds });
      for (const legacyId of b.legacyIds) previousByLegacy.set(legacyId, b);
    }
  }

  return items.map((it) => {
    const legacyId = bromideId(collectionId, it.memberId, it.no, it.size ?? null);
    const previousSlot = previousByLegacy.get(legacyId);
    const slotId = previousSlot?.id ?? newSlotId(collectionId);
    return {
      memberId: it.memberId,
      no: it.no,
      size: it.size ?? null,
      aspect: it.aspect,
      slotId,
      legacyIds: unique([legacyId, ...(previousSlot?.legacyIds ?? [])]).filter(
        (id) => id !== slotId
      )
    };
  });
}

function loadItems(bromides: Bromide[]): BromideSpec[] {
  const seen = new Set<string>();
  const items: BromideSpec[] = [];
  for (const b of bromides) {
    const key = `${b.memberId ?? GROUP_VALUE}:${b.no}:${b.size ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ memberId: b.memberId, no: b.no, size: b.size ?? null, aspect: b.aspect });
  }
  return items;
}

export function orphanedImageCount(previousBromides: Bromide[], nextSlots: BromideSpec[]): number {
  const kept = new Set<string>();
  for (const slot of nextSlots) {
    if (slot.slotId) kept.add(slot.slotId);
    for (const id of slot.legacyIds ?? []) kept.add(id);
  }
  return previousBromides.filter(
    (b) => b.imageUrl && !kept.has(b.id) && !b.legacyIds.some((id) => kept.has(id))
  ).length;
}

export function CollectionEditor({
  catalog,
  initialCollectionId
}: {
  catalog: Catalog;
  initialCollectionId?: string | null;
}) {
  const { toast } = useToaster();
  const [editing, setEditing] = useState<Collection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    collection: Collection;
    orphaned: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(catalog.members));
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [sort, setSort] = useState<{ key: 'member' | 'no' | 'size'; dir: 1 | -1 } | null>(null);
  const dragIndex = useRef<number | null>(null);

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
        seedL: (editing.sizes ?? []).includes('L'),
        seed2L: (editing.sizes ?? []).includes('2L'),
        seedLandscape: false,
        items: loadItems(buildBromides(editing))
      });
    } else {
      setForm(emptyForm(catalog.members));
    }
    setSelected(new Set());
    setSort(null);
  }, [editing, catalog.members]);

  useEffect(() => {
    if (!initialCollectionId) return;
    const target = catalog.collections.find((c) => c.id === initialCollectionId);
    if (!target) return;
    setEditing(target);
    setDialogOpen(true);
  }, [initialCollectionId, catalog.collections]);

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));

  const memberById = useMemo(
    () => new Map(catalog.members.map((m) => [m.id, m] as const)),
    [catalog.members]
  );
  const memberOrder = useMemo(
    () => new Map(catalog.members.map((m, i) => [m.id, i])),
    [catalog.members]
  );

  const toggleSeedMember = (id: string) =>
    setForm((prev) => {
      const next = new Set(prev.memberIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, memberIds: next };
    });

  const setItems = (next: BromideSpec[] | ((prev: BromideSpec[]) => BromideSpec[])) =>
    setForm((prev) => ({
      ...prev,
      items: typeof next === 'function' ? next(prev.items) : next
    }));

  const updateItem = (index: number, p: Partial<BromideSpec>) =>
    setItems((items) => items.map((it, i) => (i === index ? { ...it, ...p } : it)));

  const removeItem = (index: number) => {
    setItems((items) => items.filter((_, i) => i !== index));
    setSelected(new Set());
  };

  const seedGrid = () => {
    setForm((prev) => {
      const members: (string | null)[] =
        prev.kind === 'member_grid'
          ? catalog.members.filter((m) => prev.memberIds.has(m.id)).map((m) => m.id)
          : [null];
      if (members.length === 0) {
        toast({ title: 'メンバーを選んでください', type: 'error' });
        return prev;
      }
      const sizes = [prev.seedL ? 'L' : null, prev.seed2L ? '2L' : null].filter(
        (s): s is string => s !== null
      );
      const sizeList: (string | null)[] = sizes.length > 0 ? sizes : [null];
      const aspect = prev.seedLandscape ? LANDSCAPE_ASPECT : DEFAULT_BROMIDE_ASPECT;
      const count = Math.max(1, prev.count);
      const items: BromideSpec[] = [];
      for (const memberId of members) {
        for (let no = 1; no <= count; no += 1) {
          for (const size of sizeList) items.push({ memberId, no, size, aspect });
        }
      }
      toast({ title: `${items.length}枚を生成しました`, type: 'success' });
      return { ...prev, items };
    });
    setSelected(new Set());
  };

  const addRows = (n: number) => {
    setItems((items) => [
      ...items,
      ...Array.from({ length: n }, (_, k) => ({
        memberId: null,
        no: items.length + 1 + k,
        size: form.seedL ? 'L' : form.seed2L ? '2L' : null,
        aspect: DEFAULT_BROMIDE_ASPECT
      }))
    ]);
  };

  const sortItems = (key: 'member' | 'no' | 'size') => {
    setForm((prev) => {
      const dir: 1 | -1 = sort?.key === key && sort.dir === 1 ? -1 : 1;
      setSort({ key, dir });
      const rank = (it: BromideSpec): number | string => {
        if (key === 'member') return it.memberId ? (memberOrder.get(it.memberId) ?? 999) : 1000;
        if (key === 'size') return it.size === 'L' ? 0 : it.size === '2L' ? 1 : 2;
        return it.no;
      };
      const items = [...prev.items].sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra < rb) return -1 * dir;
        if (ra > rb) return 1 * dir;
        return (a.no - b.no) * dir;
      });
      return { ...prev, items };
    });
    setSelected(new Set());
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setItems((items) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSelected(new Set());
  };

  const toggleSelect = (index: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected((prev) =>
      prev.size === form.items.length ? new Set() : new Set(form.items.map((_, i) => i))
    );

  const applyToSelected = (p: Partial<BromideSpec>) => {
    if (selected.size === 0) return;
    setItems((items) => items.map((it, i) => (selected.has(i) ? { ...it, ...p } : it)));
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    setItems((items) => items.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
  };

  const [bulkMemberOpen, setBulkMemberOpen] = useState(false);

  const canSave = form.title.trim().length > 0 && form.items.length > 0;

  const commitSave = (collection: Collection) => {
    catalogActions.upsertCollection(collection);
    toast({ title: editing ? '更新しました' : '作成しました', type: 'success' });
    setEditing(null);
    setDialogOpen(false);
    setPendingSave(null);
    setForm(emptyForm(catalog.members));
  };

  const save = () => {
    if (!canSave) return;
    const id = editing?.id ?? `${slugify(form.title)}-${Date.now().toString(36)}`;
    const items = form.items.map((it) => ({
      memberId: it.memberId,
      no: it.no,
      size: it.size ?? null,
      aspect: it.aspect
    }));
    const slots = buildSlotsFromItems(id, items, editing);
    const memberIds = unique(items.map((it) => it.memberId).filter((m): m is string => Boolean(m)));
    const numbers = [...new Set(items.map((it) => it.no))].sort((a, b) => a - b);
    const sizes = unique(items.map((it) => it.size).filter((s): s is string => Boolean(s)));
    const collection: Collection = {
      id,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      releaseDate: form.releaseDate || undefined,
      kind: form.kind,
      memberIds,
      numbers,
      sizes: sizes.length > 0 ? sizes : undefined,
      items,
      slots,
      createdAt: editing?.createdAt ?? new Date().toISOString()
    };
    const orphaned = editing
      ? orphanedImageCount(
          catalog.bromides.filter((b) => b.collectionId === editing.id),
          slots
        )
      : 0;
    if (orphaned > 0) {
      setPendingSave({ collection, orphaned });
      return;
    }
    commitSave(collection);
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

  const startCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const startEdit = (collection: Collection) => {
    setEditing(collection);
    setDialogOpen(true);
  };

  return (
    <Stack gap="4">
      <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Stack gap="0.5">
          <Heading fontSize="md">コレクション管理</Heading>
          <Text color="fg.muted" fontSize="sm">
            管理者が画像の登録先を定義します。ユーザーは所持チェックと不足画像の投稿だけ行います。
          </Text>
        </Stack>
        <Button onClick={startCreate}>
          <FaPlus />
          新規作成
        </Button>
      </HStack>

      <Box borderColor="board.border" borderRadius="lg" borderWidth="1px" overflowX="auto">
        <Table.Root minW="760px">
          <Table.Head>
            <Table.Row>
              <Table.Header>タイトル</Table.Header>
              <Table.Header>発売日</Table.Header>
              <Table.Header>対象</Table.Header>
              <Table.Header>番号/点数</Table.Header>
              <Table.Header>サイズ</Table.Header>
              <Table.Header>総枚数</Table.Header>
              <Table.Header>状態</Table.Header>
              <Table.Header textAlign="right">操作</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {catalog.collections.map((c) => {
              const custom = !SEED_IDS.has(c.id);
              const active = editing?.id === c.id && dialogOpen;
              const total = catalog.bromides.filter((b) => b.collectionId === c.id).length;
              return (
                <Table.Row key={c.id} bgColor={active ? 'accent.subtle' : undefined}>
                  <Table.Cell>
                    <Stack gap="0.5" minW="180px">
                      <Text fontSize="sm" fontWeight="bold" truncate>
                        {c.title}
                      </Text>
                      {c.description ? (
                        <Text color="fg.muted" fontSize="xs" truncate>
                          {c.description}
                        </Text>
                      ) : null}
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="fg.muted" fontSize="sm" whiteSpace="nowrap">
                      {formatReleaseDate(c.releaseDate) ?? '未設定'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" whiteSpace="nowrap">
                      {memberCountLabel(c)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                      {c.kind === 'mixed' ? `${c.items?.length ?? 0}点` : `${c.numbers.length}番号`}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="fg.muted" fontSize="sm" whiteSpace="nowrap">
                      {c.sizes?.length ? c.sizes.join(', ') : 'なし'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                      {total}枚
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant={custom ? 'outline' : 'subtle'} colorPalette="amber">
                      {custom ? 'カスタム' : '初期データ'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap="1" justifyContent="flex-end">
                      <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                        <FaPenToSquare />
                        編集
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingDelete(c)}
                        colorPalette="red"
                      >
                        <FaTrash />
                        削除
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(e) => {
          setDialogOpen(e.open);
          if (!e.open) setEditing(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content w="full" maxW="720px" maxH="90vh" p="4" overflowY="auto">
            <Stack gap="4">
              <HStack justifyContent="space-between" alignItems="center">
                <Heading fontSize="md">
                  {editing ? 'コレクションを編集' : '新規コレクション'}
                </Heading>
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
              </Grid>

              <Stack
                gap="0"
                borderColor="board.border"
                borderRadius="xl"
                borderWidth="1px"
                overflow="hidden"
              >
                <Text px="3" pt="2.5" color="fg.muted" fontSize="xs" fontWeight="bold">
                  アイテムを生成・編集
                </Text>

                <Stack gap="2.5" p="3">
                  <HStack gap="2" alignItems="center" flexWrap="wrap">
                    <styled.span
                      flex="none"
                      w="20"
                      color="fg.muted"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      プリセット
                    </styled.span>
                    <Segment
                      options={PRESETS}
                      value={form.kind}
                      onChange={(kind) => patch({ kind })}
                    />
                  </HStack>

                  {form.kind === 'member_grid' ? (
                    <HStack gap="2" alignItems="flex-start" flexWrap="wrap">
                      <styled.span
                        flex="none"
                        w="20"
                        pt="1"
                        color="fg.muted"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        対象メンバー
                      </styled.span>
                      <Wrap flex="1" gap="1.5">
                        {catalog.members.map((m) => {
                          const on = form.memberIds.has(m.id);
                          return (
                            <HStack
                              as="button"
                              key={m.id}
                              onClick={() => toggleSeedMember(m.id)}
                              cursor="pointer"
                              gap="1.5"
                              borderColor={on ? 'accent.default' : 'board.border'}
                              borderRadius="full"
                              borderWidth="1px"
                              py="1"
                              px="2.5"
                              bgColor="board.panel"
                              opacity={on ? 1 : 0.45}
                              transition="all 0.12s"
                              _hover={{ opacity: 1 }}
                            >
                              <Box
                                style={{ backgroundColor: m.color }}
                                flexShrink="0"
                                borderRadius="full"
                                w="2"
                                h="2"
                              />
                              <Text fontSize="xs" fontWeight="medium">
                                {m.name}
                              </Text>
                            </HStack>
                          );
                        })}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            patch({
                              memberIds:
                                form.memberIds.size === catalog.members.length
                                  ? new Set()
                                  : new Set(catalog.members.map((m) => m.id))
                            })
                          }
                        >
                          {form.memberIds.size === catalog.members.length ? '全解除' : '全選択'}
                        </Button>
                      </Wrap>
                    </HStack>
                  ) : null}

                  <HStack gap="2" alignItems="center" flexWrap="wrap">
                    <styled.span
                      flex="none"
                      w="20"
                      color="fg.muted"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      生成
                    </styled.span>
                    <Text color="fg.subtle" fontSize="xs">
                      番号数
                    </Text>
                    <Box w="20">
                      <NumberInput
                        value={String(form.count)}
                        min={1}
                        max={199}
                        onValueChange={(e) =>
                          patch({ count: Math.max(1, Math.round(e.valueAsNumber || 1)) })
                        }
                      />
                    </Box>
                    <Text color="fg.subtle" fontSize="xs">
                      サイズ
                    </Text>
                    <Toggle
                      options={[
                        { value: 'L', label: 'L', on: form.seedL },
                        { value: '2L', label: '2L', on: form.seed2L }
                      ]}
                      onToggle={(v) =>
                        v === 'L' ? patch({ seedL: !form.seedL }) : patch({ seed2L: !form.seed2L })
                      }
                    />
                    <Text color="fg.subtle" fontSize="xs">
                      向き
                    </Text>
                    <Toggle
                      single
                      orientation
                      options={[
                        { value: 'p', label: '縦', on: !form.seedLandscape },
                        { value: 'l', label: '横', on: form.seedLandscape }
                      ]}
                      onToggle={(v) => patch({ seedLandscape: v === 'l' })}
                    />
                    <Button size="sm" onClick={seedGrid} colorPalette="accent" ml="auto">
                      グリッドを生成
                    </Button>
                  </HStack>
                </Stack>

                <Text px="3" pb="2.5" color="fg.subtle" fontSize="2xs">
                  「番号だけ / 自由」+ 番号41 → 41枚を一発生成（空アイテムもOK）。
                </Text>

                <HStack
                  gap="2"
                  alignItems="center"
                  borderColor="board.border"
                  borderTopWidth="1px"
                  py="2"
                  px="3"
                  flexWrap="wrap"
                >
                  <Button size="xs" variant="outline" onClick={() => addRows(10)}>
                    ＋10行
                  </Button>
                  <Box w="1px" h="4" bgColor="board.border" />
                  {selected.size > 0 ? (
                    <>
                      <Text color="accent.text" fontSize="xs" fontWeight="bold">
                        {selected.size}件選択中
                      </Text>
                      <Box position="relative">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setBulkMemberOpen((v) => !v)}
                        >
                          メンバー一括 ▾
                        </Button>
                        {bulkMemberOpen ? (
                          <Stack
                            zIndex="10"
                            position="absolute"
                            top="full"
                            left="0"
                            gap="0.5"
                            borderColor="board.border"
                            borderRadius="lg"
                            borderWidth="1px"
                            minW="36"
                            maxH="56"
                            mt="1"
                            p="1"
                            bgColor="bg.default"
                            boxShadow="lg"
                            overflowY="auto"
                          >
                            {[...catalog.members, null].map((m) => {
                              const memberId = m?.id ?? null;
                              return (
                                <HStack
                                  as="button"
                                  key={memberId ?? GROUP_VALUE}
                                  onClick={() => {
                                    applyToSelected({ memberId });
                                    setBulkMemberOpen(false);
                                  }}
                                  cursor="pointer"
                                  gap="1.5"
                                  borderRadius="md"
                                  py="1"
                                  px="2"
                                  _hover={{ bgColor: 'bg.muted' }}
                                >
                                  <Box
                                    style={{ backgroundColor: m?.color ?? '#cbd5e1' }}
                                    flexShrink="0"
                                    borderRadius="full"
                                    w="2"
                                    h="2"
                                  />
                                  <Text fontSize="xs">{m ? m.name : '集合'}</Text>
                                </HStack>
                              );
                            })}
                          </Stack>
                        ) : null}
                      </Box>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => applyToSelected({ size: 'L' })}
                      >
                        サイズ L
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => applyToSelected({ size: '2L' })}
                      >
                        サイズ 2L
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => applyToSelected({ aspect: DEFAULT_BROMIDE_ASPECT })}
                      >
                        向き 縦
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => applyToSelected({ aspect: LANDSCAPE_ASPECT })}
                      >
                        向き 横
                      </Button>
                      <Button size="xs" variant="ghost" onClick={deleteSelected} colorPalette="red">
                        選択を削除
                      </Button>
                    </>
                  ) : (
                    <Text color="fg.subtle" fontSize="xs">
                      行を選択すると一括操作できます
                    </Text>
                  )}
                  <Text ml="auto" color="fg.muted" fontSize="xs">
                    全{' '}
                    <styled.b color="fg.default" fontVariantNumeric="tabular-nums">
                      {form.items.length}
                    </styled.b>{' '}
                    枚
                  </Text>
                </HStack>

                <Box borderColor="board.border" borderTopWidth="1px" maxH="280px" overflow="auto">
                  <Table.Root size="sm" minW="520px">
                    <Table.Head>
                      <Table.Row>
                        <Table.Header w="9" textAlign="center">
                          <styled.input
                            type="checkbox"
                            checked={form.items.length > 0 && selected.size === form.items.length}
                            onChange={toggleSelectAll}
                            cursor="pointer"
                          />
                        </Table.Header>
                        <Table.Header w="7" />
                        <SortHeader
                          label="メンバー"
                          active={sort?.key === 'member'}
                          onClick={() => sortItems('member')}
                        />
                        <SortHeader
                          label="番号"
                          active={sort?.key === 'no'}
                          onClick={() => sortItems('no')}
                          w="20"
                        />
                        <SortHeader
                          label="サイズ"
                          active={sort?.key === 'size'}
                          onClick={() => sortItems('size')}
                          w="24"
                        />
                        <Table.Header w="28">向き</Table.Header>
                        <Table.Header w="9" />
                      </Table.Row>
                    </Table.Head>
                    <Table.Body>
                      {form.items.map((it, i) => {
                        const member = it.memberId ? memberById.get(it.memberId) : undefined;
                        const sel = selected.has(i);
                        return (
                          <Table.Row
                            key={`${it.memberId ?? GROUP_VALUE}:${it.no}:${it.size ?? ''}:${i}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (dragIndex.current !== null) reorder(dragIndex.current, i);
                              dragIndex.current = null;
                            }}
                            bgColor={sel ? 'accent.subtle' : undefined}
                          >
                            <Table.Cell textAlign="center">
                              <styled.input
                                type="checkbox"
                                checked={sel}
                                onChange={() => toggleSelect(i)}
                                cursor="pointer"
                              />
                            </Table.Cell>
                            <Table.Cell
                              draggable
                              onDragStart={() => {
                                dragIndex.current = i;
                              }}
                              onDragEnd={() => {
                                dragIndex.current = null;
                              }}
                              cursor="grab"
                              color="fg.subtle"
                              textAlign="center"
                            >
                              ⋮⋮
                            </Table.Cell>
                            <Table.Cell>
                              <HStack gap="1.5" alignItems="center">
                                <Box
                                  style={{ backgroundColor: member?.color ?? '#cbd5e1' }}
                                  flexShrink="0"
                                  borderRadius="full"
                                  w="2"
                                  h="2"
                                />
                                <styled.select
                                  value={it.memberId ?? GROUP_VALUE}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      memberId:
                                        e.target.value === GROUP_VALUE ? null : e.target.value
                                    })
                                  }
                                  cursor="pointer"
                                  border="none"
                                  outline="none"
                                  w="full"
                                  color="fg.default"
                                  fontSize="xs"
                                  bgColor="transparent"
                                >
                                  <option value={GROUP_VALUE}>集合</option>
                                  {catalog.members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </styled.select>
                              </HStack>
                            </Table.Cell>
                            <Table.Cell>
                              <styled.input
                                type="number"
                                min={1}
                                value={it.no}
                                onChange={(e) =>
                                  updateItem(i, {
                                    no: Math.max(1, Math.round(Number(e.target.value) || 1))
                                  })
                                }
                                outline="none"
                                borderColor="border.default"
                                borderRadius="md"
                                borderWidth="1px"
                                w="14"
                                py="1"
                                px="2"
                                color="fg.default"
                                fontSize="xs"
                                fontVariantNumeric="tabular-nums"
                                textAlign="right"
                                bgColor="bg.default"
                                _focus={{ borderColor: 'accent.default' }}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <Toggle
                                options={[
                                  { value: 'L', label: 'L', on: it.size === 'L' },
                                  { value: '2L', label: '2L', on: it.size === '2L' }
                                ]}
                                onToggle={(v) => updateItem(i, { size: it.size === v ? null : v })}
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <Toggle
                                single
                                orientation
                                options={[
                                  { value: 'p', label: '縦', on: !isLandscape(it.aspect) },
                                  { value: 'l', label: '横', on: isLandscape(it.aspect) }
                                ]}
                                onToggle={(v) =>
                                  updateItem(i, {
                                    aspect: v === 'l' ? LANDSCAPE_ASPECT : DEFAULT_BROMIDE_ASPECT
                                  })
                                }
                              />
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <styled.button
                                type="button"
                                aria-label="削除"
                                onClick={() => removeItem(i)}
                                cursor="pointer"
                                color="fg.subtle"
                                fontSize="xs"
                                _hover={{ color: 'red.10' }}
                              >
                                ✕
                              </styled.button>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                      {form.items.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={7}>
                            <Text py="4" color="fg.subtle" fontSize="xs" textAlign="center">
                              「グリッドを生成」または「＋10行」でアイテムを作成してください
                            </Text>
                          </Table.Cell>
                        </Table.Row>
                      ) : null}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Stack>

              <Button type="button" onClick={save} disabled={!canSave}>
                {editing ? <FaCheck /> : <FaPlus />}
                {editing ? '更新する' : '作成する'}
              </Button>
            </Stack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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

      <Dialog.Root
        open={pendingSave !== null}
        onOpenChange={(e) => {
          if (!e.open) setPendingSave(null);
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
                  <Heading fontSize="lg">登録済み画像が枠から外れます</Heading>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <Text color="fg.muted" fontSize="sm">
                    この設定変更で{pendingSave?.orphaned}
                    枚の登録済み画像が現在の枠から切り離されます。所持データも切り離される可能性があります。続行しますか？
                  </Text>
                </Dialog.Description>
              </Stack>
              <HStack gap="2" justifyContent="flex-end">
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline">キャンセル</Button>
                </Dialog.CloseTrigger>
                <Button
                  onClick={() => pendingSave && commitSave(pendingSave.collection)}
                  colorPalette="red"
                >
                  続行する
                </Button>
              </HStack>
            </Stack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Stack>
  );
}

function SortHeader({
  label,
  active,
  onClick,
  w
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  w?: string;
}) {
  return (
    <Table.Header onClick={onClick} cursor="pointer" w={w} userSelect="none">
      <HStack gap="1" alignItems="center">
        <styled.span>{label}</styled.span>
        <styled.span color={active ? 'accent.text' : 'fg.subtle'} fontSize="2xs">
          ▲▼
        </styled.span>
      </HStack>
    </Table.Header>
  );
}

function Segment<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <HStack
      gap="0"
      borderColor="board.border"
      borderRadius="lg"
      borderWidth="1px"
      overflow="hidden"
    >
      {options.map((o, i) => {
        const on = value === o.value;
        return (
          <styled.button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            cursor="pointer"
            borderColor="board.border"
            borderLeftWidth={i === 0 ? '0' : '1px'}
            py="1.5"
            px="3"
            color={on ? 'accent.fg' : 'fg.muted'}
            fontSize="xs"
            fontWeight="bold"
            bgColor={on ? 'accent.default' : 'bg.default'}
            transition="background-color 0.12s, color 0.12s"
            _hover={on ? undefined : { bgColor: 'bg.muted' }}
          >
            {o.label}
          </styled.button>
        );
      })}
    </HStack>
  );
}

function Toggle({
  options,
  onToggle,
  orientation,
  single
}: {
  options: { value: string; label: string; on: boolean }[];
  onToggle: (value: string) => void;
  orientation?: boolean;
  single?: boolean;
}) {
  return (
    <HStack
      gap="0"
      borderColor="board.border"
      borderRadius="md"
      borderWidth="1px"
      w="fit-content"
      overflow="hidden"
    >
      {options.map((o, i) => (
        <styled.button
          key={o.value}
          type="button"
          onClick={() => {
            if (single && o.on) return;
            onToggle(o.value);
          }}
          cursor="pointer"
          borderColor="board.border"
          borderLeftWidth={i === 0 ? '0' : '1px'}
          py="1"
          px="2.5"
          color={o.on ? (orientation ? 'accent.text' : 'fg.default') : 'fg.subtle'}
          fontSize="xs"
          fontWeight="bold"
          bgColor={o.on ? (orientation ? 'accent.subtle' : 'bg.muted') : 'bg.default'}
          transition="background-color 0.12s, color 0.12s"
          _hover={o.on ? undefined : { bgColor: 'bg.muted' }}
        >
          {o.label}
        </styled.button>
      ))}
    </HStack>
  );
}
