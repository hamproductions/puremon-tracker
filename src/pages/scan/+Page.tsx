import { useEffect, useMemo, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { FaBolt, FaCamera, FaListCheck } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Tabs } from '~/components/ui/tabs';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { CollectionPicker } from '~/components/scan/CollectionPicker';
import { QuickRegister } from '~/components/scan/QuickRegister';
import { ScanMode } from '~/components/scan/ScanMode';
import { ScanProgress } from '~/components/scan/ScanProgress';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { useOwnership } from '~/hooks/useOwnership';
import { activeSizeOf, bromidesByCollection, collectionStats } from '~/utils/stats';

type Mode = 'quick' | 'scan';

export default function Page() {
  const ctx = usePageContext();
  const preselect = ctx.urlParsed.search['c'];
  const catalog = useCatalog();
  const mounted = useMounted();
  const { ownership } = useOwnership();

  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('quick');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || catalog.collections.length === 0) return;
    const valid = preselect && catalog.collections.some((c) => c.id === preselect);
    setCollectionId(valid ? preselect : (catalog.collections[0]?.id ?? null));
    setSeeded(true);
  }, [seeded, preselect, catalog.collections]);

  const collection = useMemo(
    () => catalog.collections.find((c) => c.id === collectionId) ?? null,
    [catalog.collections, collectionId]
  );

  useEffect(() => {
    setSize(collection?.sizes?.[0]);
  }, [collection?.id, collection?.sizes]);

  const activeSize = collection ? (activeSizeOf(collection, size) ?? undefined) : undefined;

  const bromides = useMemo(
    () => (collection ? bromidesByCollection(catalog, collection.id, activeSize) : []),
    [catalog, collection, activeSize]
  );

  const allBromides = useMemo(
    () => (collection ? bromidesByCollection(catalog, collection.id) : []),
    [catalog, collection]
  );

  const totalStats = useMemo(
    () => (collection ? collectionStats(catalog, collection.id, ownership) : null),
    [catalog, collection, ownership]
  );
  const totalImageCount = useMemo(
    () => allBromides.filter((b) => b.imageUrl).length,
    [allBromides]
  );

  const ownedCount = useMemo(
    () => bromides.filter((b) => (ownership[b.id] ?? 0) > 0).length,
    [bromides, ownership]
  );
  const imageCount = useMemo(() => bromides.filter((b) => b.imageUrl).length, [bromides]);

  const header = (
    <Stack gap="1">
      <HStack gap="2" alignItems="center">
        <Box color="accent.default" fontSize="lg">
          <FaBolt />
        </Box>
        <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1">
          まとめて登録・スキャン
        </Heading>
      </HStack>
      <Text maxW="2xl" color="fg.muted" fontSize="sm">
        所持の記録と画像の登録を一気に。タップ連打や撮影で、サクサク追加できます。
      </Text>
    </Stack>
  );

  if (!mounted) {
    return (
      <Stack gap="6" pt="2">
        <Metadata title="まとめて登録・スキャン" helmet />
        {header}
        <Box
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          h="64"
          bgColor="board.panel"
        />
      </Stack>
    );
  }

  if (!collection) {
    return (
      <Stack gap="6" pt="2">
        <Metadata title="まとめて登録・スキャン" helmet />
        {header}
        <Stack gap="4" alignItems="center" py="16" textAlign="center">
          <Box fontSize="4xl">📭</Box>
          <Text color="fg.muted" fontSize="sm">
            コレクションがまだありません。
          </Text>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="5" pt="2">
      <Metadata title="まとめて登録・スキャン" helmet />
      {header}

      <Stack gap="2.5">
        <Text color="fg.muted" fontSize="xs" fontWeight="bold">
          コレクションを選ぶ
        </Text>
        <CollectionPicker
          collections={catalog.collections}
          value={collectionId}
          onSelect={setCollectionId}
        />
        {collection.sizes?.length ? (
          <HStack gap="2.5" alignItems="center" flexWrap="wrap">
            <Text color="fg.muted" fontSize="xs" fontWeight="bold">
              サイズ
            </Text>
            <SegmentGroup.Root
              value={activeSize ?? ''}
              onValueChange={(e) => setSize(e.value)}
              size="sm"
              orientation="horizontal"
            >
              <SegmentGroup.Indicator />
              {collection.sizes.map((s) => (
                <SegmentGroup.Item key={s} value={s}>
                  <SegmentGroup.ItemText>{s}</SegmentGroup.ItemText>
                  <SegmentGroup.ItemControl />
                  <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
              ))}
            </SegmentGroup.Root>
          </HStack>
        ) : null}
      </Stack>

      <ScanProgress
        label={`${activeSize ? `${activeSize} ` : ''}${mode === 'quick' ? '所持' : '画像あり'}`}
        current={mode === 'quick' ? ownedCount : imageCount}
        total={bromides.length}
        note={
          activeSize && totalStats
            ? `全体 ${mode === 'quick' ? totalStats.owned : totalImageCount}/${totalStats.total}`
            : undefined
        }
      />

      <Tabs.Root value={mode} onValueChange={(e) => setMode(e.value as Mode)}>
        <Tabs.List>
          <Tabs.Trigger value="quick">
            <FaListCheck />
            クイック登録
          </Tabs.Trigger>
          <Tabs.Trigger value="scan">
            <FaCamera />
            スキャン
          </Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="quick">
          <QuickRegister catalog={catalog} collection={collection} size={activeSize} />
        </Tabs.Content>

        <Tabs.Content value="scan">
          <ScanMode catalog={catalog} collection={collection} size={activeSize} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
