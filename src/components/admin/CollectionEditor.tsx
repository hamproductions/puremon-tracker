import { useEffect, useMemo, useState } from 'react';
import { FaCheck, FaPenToSquare, FaPlus, FaTrash, FaXmark } from 'react-icons/fa6';
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
import { formatReleaseDate, kindLabel, memberCountLabel } from '~/components/collection/format';
import type { Bromide, BromideSpec, Catalog, Collection, CollectionKind, Member } from '~/types';
import { formatAspect, parseAspect } from '~/utils/aspect';

const SEED_IDS = new Set(seedCatalog.collections.map((c) => c.id));

const TEMPLATES: {
  value: CollectionKind;
  label: string;
  hint: string;
  example: string;
}[] = [
  {
    value: 'member_grid',
    label: 'メンバー別グリッド',
    hint: 'メンバー × 番号で一括生成',
    example: '例：7人 × 10番号 → 70枚'
  },
  {
    value: 'flat',
    label: '番号だけ',
    hint: '集合写真など、番号のみで一括生成',
    example: '例：41番号 → 41枚'
  },
  {
    value: 'mixed',
    label: '自由リスト',
    hint: '1枚ずつ自由に並べる（番号の一括追加も可）',
    example: '例：メンバー指定や特殊カード'
  }
];

const GROUP_VALUE = '__group__';

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
  sizes: string;
  aspectText: string;
  items: BromideSpec[];
  addMemberId: string | null;
  addNo: number;
  addAspectText: string;
  bulkFrom: number;
  bulkTo: number;
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
    aspectText: '',
    items: [],
    addMemberId: members[0]?.id ?? null,
    addNo: 1,
    addAspectText: '',
    bulkFrom: 1,
    bulkTo: 10
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
        aspectText: formatAspect(editing.slots?.find((slot) => slot.aspect)?.aspect),
        items: (editing.items ?? []).map((it) => ({
          memberId: it.memberId,
          no: it.no,
          type: it.type,
          label: it.label,
          aspect: it.aspect
        })),
        addMemberId: catalog.members[0]?.id ?? null,
        addNo: 1,
        addAspectText: '',
        bulkFrom: 1,
        bulkTo: 10
      });
    } else {
      setForm(emptyForm(catalog.members));
    }
  }, [editing, catalog.members]);

  useEffect(() => {
    if (!initialCollectionId) return;
    const target = catalog.collections.find((c) => c.id === initialCollectionId);
    if (!target) return;
    setEditing(target);
    setDialogOpen(true);
  }, [initialCollectionId, catalog.collections]);

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
    const input =
      typeof document === 'undefined'
        ? null
        : document.querySelector<HTMLInputElement>('[data-add-type-input]');
    const type = input?.value.trim() || undefined;
    const aspect = parseAspect(form.addAspectText);
    setForm((prev) => {
      const exists = prev.items.some(
        (it) => it.memberId === prev.addMemberId && it.no === prev.addNo && it.type === type
      );
      if (exists) {
        toast({ title: 'すでに追加済みです', type: 'error' });
        return prev;
      }
      return {
        ...prev,
        items: [...prev.items, { memberId: prev.addMemberId, no: prev.addNo, type, aspect }]
      };
    });
    if (input) input.value = '';
  };

  const removeItem = (index: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const addRange = () => {
    setForm((prev) => {
      const from = Math.min(prev.bulkFrom, prev.bulkTo);
      const to = Math.max(prev.bulkFrom, prev.bulkTo);
      const existing = new Set(prev.items.map((it) => `${it.memberId ?? GROUP_VALUE}:${it.no}`));
      const added: BromideSpec[] = [];
      for (let no = from; no <= to; no += 1) {
        const key = `${prev.addMemberId ?? GROUP_VALUE}:${no}`;
        if (existing.has(key)) continue;
        existing.add(key);
        added.push({ memberId: prev.addMemberId, no });
      }
      if (added.length === 0) {
        toast({ title: 'その範囲はすべて追加済みです', type: 'error' });
        return prev;
      }
      toast({ title: `${added.length}枚を追加しました`, type: 'success' });
      return { ...prev, items: [...prev.items, ...added] };
    });
  };

  const seedCount = useMemo(() => {
    const sizeCount = Math.max(1, parseSizes(form.sizes).length);
    if (form.kind === 'mixed') return form.items.length * sizeCount;
    if (form.kind === 'flat') return form.count * sizeCount;
    return selectedMembers.length * form.count * sizeCount;
  }, [form.kind, form.items.length, form.sizes, form.count, selectedMembers.length]);

  const seedSummary = useMemo(() => {
    const sizes = parseSizes(form.sizes);
    const sizePart = sizes.length > 0 ? ` × ${sizes.length}サイズ` : '';
    if (form.kind === 'mixed') return `${form.items.length}点${sizePart} = ${seedCount}枚`;
    if (form.kind === 'flat') return `${form.count}番号${sizePart} = ${seedCount}枚`;
    return `${selectedMembers.length}人 × ${form.count}番号${sizePart} = ${seedCount}枚`;
  }, [form.kind, form.items.length, form.sizes, form.count, selectedMembers.length, seedCount]);

  const canSave =
    form.title.trim().length > 0 &&
    (form.kind === 'mixed'
      ? form.items.length > 0
      : form.count >= 1 && (form.kind === 'flat' || selectedMembers.length > 0));

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
    const sizes = parseSizes(form.sizes);
    const aspect = parseAspect(form.aspectText);
    const base = {
      id: editing?.id ?? `${slugify(form.title)}-${Date.now().toString(36)}`,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      releaseDate: form.releaseDate || undefined,
      sizes: sizes.length > 0 ? sizes : undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString()
    };
    const collectionWithoutSlots: Collection =
      form.kind === 'mixed'
        ? {
            ...base,
            kind: 'mixed',
            memberIds: [],
            numbers: [],
            items: form.items.map((it) => ({
              memberId: it.memberId,
              no: it.no,
              type: it.type,
              label: it.label,
              aspect: it.aspect
            }))
          }
        : {
            ...base,
            kind: form.kind,
            memberIds: form.kind === 'flat' ? [] : selectedMembers.map((m) => m.id),
            numbers: Array.from({ length: form.count }, (_, i) => i + 1)
          };
    const collection: Collection = {
      ...collectionWithoutSlots,
      slots: buildStableSlots(collectionWithoutSlots, editing, aspect)
    };
    const orphaned = editing
      ? orphanedImageCount(
          catalog.bromides.filter((b) => b.collectionId === editing.id),
          collection.slots ?? []
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
        <Table.Root minW="840px">
          <Table.Head>
            <Table.Row>
              <Table.Header>タイトル</Table.Header>
              <Table.Header>種別</Table.Header>
              <Table.Header>発売日</Table.Header>
              <Table.Header>対象</Table.Header>
              <Table.Header>番号/点数</Table.Header>
              <Table.Header>サイズ</Table.Header>
              <Table.Header>比率</Table.Header>
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
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette={
                        c.kind === 'member_grid' ? 'pink' : c.kind === 'mixed' ? 'red' : 'gray'
                      }
                    >
                      {kindLabel(c.kind)}
                    </Badge>
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
                    <Text color="fg.muted" fontSize="sm" whiteSpace="nowrap">
                      {formatAspect(c.slots?.find((slot) => slot.aspect)?.aspect) || '3/4'}
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
                <FieldLabel>種類を選ぶ</FieldLabel>
                <Grid gap="2" columns={{ base: 1, sm: 3 }}>
                  {TEMPLATES.map((t) => {
                    const active = form.kind === t.value;
                    return (
                      <Stack
                        as="button"
                        key={t.value}
                        onClick={() => patch({ kind: t.value })}
                        cursor="pointer"
                        gap="0.5"
                        borderColor={active ? 'accent.default' : 'board.border'}
                        borderRadius="lg"
                        borderWidth="1px"
                        p="2.5"
                        textAlign="left"
                        bgColor={active ? 'accent.subtle' : 'board.panel'}
                        transition="all 0.12s"
                        _hover={{ borderColor: 'accent.default' }}
                      >
                        <Text fontSize="sm" fontWeight="bold">
                          {t.label}
                        </Text>
                        <Text color="fg.muted" fontSize="2xs" lineHeight="1.3">
                          {t.hint}
                        </Text>
                        <Text color="fg.subtle" fontSize="2xs">
                          {t.example}
                        </Text>
                      </Stack>
                    );
                  })}
                </Grid>
              </Stack>

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
                <FieldLabel>サイズ（カンマ区切り・空欄で無し）</FieldLabel>
                <Input
                  value={form.sizes}
                  onChange={(e) => patch({ sizes: e.target.value })}
                  placeholder="L, 2L"
                />
              </Stack>

              <HStack
                gap="2"
                justifyContent="space-between"
                borderColor="accent.default"
                borderRadius="lg"
                borderWidth="1px"
                py="2"
                px="3"
                bgColor="accent.subtle"
              >
                <Text color="fg.muted" fontSize="xs">
                  生成される枚数
                </Text>
                <Text fontSize="sm" fontWeight="bold" fontVariantNumeric="tabular-nums">
                  {seedSummary}
                </Text>
              </HStack>

              {form.kind === 'mixed' ? null : (
                <Stack gap="1.5">
                  <FieldLabel>画像比率（空欄で 3/4）</FieldLabel>
                  <Input
                    value={form.aspectText}
                    onChange={(e) => patch({ aspectText: e.target.value })}
                    placeholder="3/4, 4/3, 1, 16/9"
                  />
                </Stack>
              )}

              {form.kind === 'member_grid' ? (
                <Stack gap="1.5">
                  <FieldLabel>対象メンバー</FieldLabel>
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
                  <FieldLabel>画像リスト</FieldLabel>
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
                          <Box
                            style={{ backgroundColor: m.color }}
                            borderRadius="full"
                            w="2.5"
                            h="2.5"
                          />
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
                  <Stack
                    gap="1.5"
                    borderColor="board.border"
                    borderRadius="lg"
                    borderWidth="1px"
                    p="2.5"
                    bgColor="board.panel"
                  >
                    <FieldLabel>番号で一括追加</FieldLabel>
                    <HStack gap="2" alignItems="end" flexWrap="wrap">
                      <Stack flex="1" gap="1" minW="20">
                        <Text color="fg.subtle" fontSize="2xs">
                          開始
                        </Text>
                        <NumberInput
                          value={String(form.bulkFrom)}
                          min={1}
                          max={199}
                          onValueChange={(e) =>
                            patch({ bulkFrom: Math.max(1, Math.round(e.valueAsNumber || 1)) })
                          }
                        />
                      </Stack>
                      <Stack flex="1" gap="1" minW="20">
                        <Text color="fg.subtle" fontSize="2xs">
                          終了
                        </Text>
                        <NumberInput
                          value={String(form.bulkTo)}
                          min={1}
                          max={199}
                          onValueChange={(e) =>
                            patch({ bulkTo: Math.max(1, Math.round(e.valueAsNumber || 1)) })
                          }
                        />
                      </Stack>
                      <Button
                        type="button"
                        variant="solid"
                        onClick={addRange}
                        colorPalette="accent"
                      >
                        <FaPlus />
                        番号をまとめて追加
                      </Button>
                    </HStack>
                    <Text color="fg.subtle" fontSize="2xs">
                      上で選んだメンバーに、開始〜終了の番号をまとめて追加します
                    </Text>
                  </Stack>

                  <HStack gap="2" alignItems="end">
                    <Stack flex="1" gap="1.5">
                      <FieldLabel>管理番号</FieldLabel>
                      <NumberInput
                        value={String(form.addNo)}
                        min={1}
                        max={99}
                        onValueChange={(e) =>
                          patch({ addNo: Math.max(1, Math.round(e.valueAsNumber || 1)) })
                        }
                      />
                    </Stack>
                    <Stack flex="2" gap="1.5">
                      <FieldLabel>タイプ / タグ</FieldLabel>
                      <styled.input
                        data-add-type-input
                        placeholder="A, 引き, レア"
                        borderColor="border.default"
                        borderRadius="l2"
                        borderWidth="1px"
                        h="10"
                        px="3"
                        color="fg.default"
                        fontSize="sm"
                        bgColor="bg.default"
                      />
                    </Stack>
                    <Stack flex="1" gap="1.5">
                      <FieldLabel>画像比率</FieldLabel>
                      <Input
                        value={form.addAspectText}
                        onChange={(e) => patch({ addAspectText: e.target.value })}
                        placeholder="4/3"
                      />
                    </Stack>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem();
                      }}
                    >
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
                              {it.type ?? `No.${it.no}`}
                            </Text>
                            {it.aspect ? (
                              <Badge size="sm" variant="subtle" colorPalette="gray">
                                {formatAspect(it.aspect)}
                              </Badge>
                            ) : null}
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
                      メンバータグとタイプを選び、必要なら管理番号で区別してください
                    </Text>
                  )}
                </Stack>
              ) : null}

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
