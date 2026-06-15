import { useMemo, useState } from 'react';
import { FaArrowRightArrowLeft, FaImage, FaLayerGroup, FaStar } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { ProgressBar } from '~/components/bromide/Progress';
import { CompletionView } from '~/components/mypick/CompletionView';
import { DuplicateView } from '~/components/mypick/DuplicateView';
import { ExportDialog } from '~/components/mypick/ExportDialog';
import { MemberFilter } from '~/components/mypick/MemberFilter';
import { MissingView } from '~/components/mypick/MissingView';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { useOwnership } from '~/hooks/useOwnership';
import { overallStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

type ViewKey = 'missing' | 'duplicate' | 'completion';

const VIEW_ITEMS: { value: ViewKey; label: string }[] = [
  { value: 'missing', label: '不足' },
  { value: 'duplicate', label: 'ダブり' },
  { value: 'completion', label: 'コンプ状況' }
];

export default function Page() {
  const catalog = useCatalog();
  const { ownership } = useOwnership();
  const mounted = useMounted();

  const [view, setView] = useState<ViewKey>('missing');
  const [collectionId, setCollectionId] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const overall = overallStats(catalog, ownership);

  const visibleCollections = useMemo(
    () =>
      collectionId === 'all'
        ? catalog.collections
        : catalog.collections.filter((c) => c.id === collectionId),
    [catalog.collections, collectionId]
  );

  const filtered = useMemo(() => {
    const ids = new Set(visibleCollections.map((c) => c.id));
    let owned = 0;
    let total = 0;
    let duplicates = 0;
    for (const b of catalog.bromides) {
      if (!ids.has(b.collectionId)) continue;
      if (memberFilter.size > 0 && (!b.memberId || !memberFilter.has(b.memberId))) continue;
      total += 1;
      const cnt = ownership[b.id] ?? 0;
      if (cnt >= 1) owned += 1;
      if (cnt >= 2) duplicates += cnt - 1;
    }
    return {
      owned,
      total,
      missing: total - owned,
      duplicates,
      percent: total ? Math.round((owned / total) * 100) : 0
    };
  }, [catalog.bromides, visibleCollections, memberFilter, ownership]);

  const isFiltered = collectionId !== 'all' || memberFilter.size > 0;

  const toggleMember = (id: string) =>
    setMemberFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const empty = mounted && overall.owned === 0;

  return (
    <Stack gap="6" pt="2">
      <Metadata title="マイコレ・不足" helmet />

      <HStack gap="3" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap">
        <Stack gap="1">
          <HStack gap="2" alignItems="center">
            <Box color="accent.default" fontSize="lg">
              <FaStar />
            </Box>
            <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1">
              マイコレ・不足
            </Heading>
          </HStack>
          <Text color="fg.muted" fontSize="sm">
            あなたのコレクション全体の進捗・不足・ダブりをまとめて確認できます。
          </Text>
        </Stack>
        <Button
          variant="solid"
          onClick={() => setExportOpen(true)}
          disabled={!mounted || overall.owned === 0}
        >
          <FaImage />
          画像で保存
        </Button>
      </HStack>

      <Box
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p={{ base: '4', md: '6' }}
        bgColor="board.panel"
        backdropFilter="blur(8px)"
      >
        {empty ? (
          <Stack gap="4" alignItems="center" py="6" textAlign="center">
            <Box fontSize="4xl">📭</Box>
            <Stack gap="1">
              <Heading fontSize="lg">まだ記録がありません</Heading>
              <Text maxW="md" color="fg.muted" fontSize="sm">
                コレクションでタイルをタップして所持を記録しよう。
              </Text>
            </Stack>
            <Link href={toAppUrl('/collections')} _hover={{ textDecoration: 'none' }}>
              <Button>
                <FaLayerGroup />
                コレクションを見る
              </Button>
            </Link>
          </Stack>
        ) : (
          <Stack gap="4">
            <Grid gap="4" alignItems="center" columns={{ base: 1, md: 3 }}>
              <Stack gap="0.5" gridColumn={{ md: 'span 1' }}>
                <Text color="fg.muted" fontSize="sm">
                  {isFiltered ? '所持枚数（絞り込み）' : '所持枚数'}
                </Text>
                <HStack gap="1.5" alignItems="baseline">
                  <Text
                    textStyle="display"
                    fontSize="4xl"
                    fontVariantNumeric="tabular-nums"
                    lineHeight="1"
                  >
                    {mounted ? filtered.owned : 0}
                  </Text>
                  <Text color="fg.muted" fontSize="lg" fontVariantNumeric="tabular-nums">
                    / {filtered.total} 枚
                  </Text>
                </HStack>
              </Stack>

              <Stack gap="2" gridColumn={{ md: 'span 2' }}>
                <HStack justifyContent="space-between" alignItems="baseline">
                  <Text color="fg.muted" fontSize="sm">
                    コンプ率
                  </Text>
                  <HStack gap="1" alignItems="baseline">
                    <Text
                      textStyle="display"
                      color="accent.default"
                      fontSize="2xl"
                      fontVariantNumeric="tabular-nums"
                      lineHeight="1"
                    >
                      {mounted ? filtered.percent : 0}
                    </Text>
                    <Text color="accent.default" fontSize="sm" fontWeight="bold">
                      %
                    </Text>
                  </HStack>
                </HStack>
                <ProgressBar percent={mounted ? filtered.percent : 0} />
                <HStack gap="2" pt="0.5" flexWrap="wrap">
                  <Badge size="md" variant="subtle" colorPalette="gray">
                    不足 {mounted ? filtered.missing : filtered.total}
                  </Badge>
                  <Badge size="md" variant="subtle" colorPalette="amber">
                    ダブり {mounted ? filtered.duplicates : 0}
                  </Badge>
                </HStack>
              </Stack>
            </Grid>
          </Stack>
        )}
      </Box>

      {empty ? null : (
        <>
          <Stack gap="3">
            <MemberFilter
              members={catalog.members}
              selected={memberFilter}
              onToggle={toggleMember}
              onAll={() => setMemberFilter(new Set())}
            />

            <Box mx={{ base: '-4', md: '0' }} px={{ base: '4', md: '0' }} overflowX="auto">
              <HStack gap="1.5" minW="max-content">
                <CollectionChip
                  label="すべて"
                  active={collectionId === 'all'}
                  onClick={() => setCollectionId('all')}
                />
                {catalog.collections.map((c) => (
                  <CollectionChip
                    key={c.id}
                    label={c.title}
                    active={collectionId === c.id}
                    onClick={() => setCollectionId(c.id)}
                  />
                ))}
              </HStack>
            </Box>
          </Stack>

          <SegmentGroup.Root
            value={view}
            onValueChange={(e) => setView(e.value as ViewKey)}
            size="sm"
            orientation="horizontal"
          >
            <SegmentGroup.Indicator />
            {VIEW_ITEMS.map((item) => (
              <SegmentGroup.Item key={item.value} value={item.value}>
                <SegmentGroup.ItemText>{item.label}</SegmentGroup.ItemText>
                <SegmentGroup.ItemControl />
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            ))}
          </SegmentGroup.Root>

          {!mounted ? (
            <SkeletonPanel />
          ) : view === 'missing' ? (
            <MissingView
              catalog={catalog}
              ownership={ownership}
              collections={visibleCollections}
              memberFilter={memberFilter}
            />
          ) : view === 'duplicate' ? (
            <DuplicateView
              catalog={catalog}
              ownership={ownership}
              collections={visibleCollections}
              memberFilter={memberFilter}
            />
          ) : (
            <CompletionView
              catalog={catalog}
              ownership={ownership}
              collections={visibleCollections}
              memberFilter={memberFilter}
            />
          )}

          {mounted && overall.duplicates > 0 ? (
            <HStack
              gap="3"
              justifyContent="space-between"
              borderColor="board.border"
              borderRadius="2xl"
              borderWidth="1px"
              p={{ base: '4', md: '5' }}
              bgColor="board.panel"
              flexWrap="wrap"
            >
              <Stack gap="0.5">
                <Heading fontSize="md">ダブり {overall.duplicates} 枚を交換しよう</Heading>
                <Text color="fg.muted" fontSize="sm">
                  余ったブロマイドは譲渡テキストにして交換相手を探せます。
                </Text>
              </Stack>
              <Link href={toAppUrl('/trade')} _hover={{ textDecoration: 'none' }}>
                <Button variant="outline">
                  <FaArrowRightArrowLeft />
                  ダブりを交換する →
                </Button>
              </Link>
            </HStack>
          ) : null}
        </>
      )}

      {mounted ? (
        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          catalog={catalog}
          ownership={ownership}
        />
      ) : null}
    </Stack>
  );
}

function CollectionChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      borderColor={active ? 'accent.default' : 'board.border'}
      borderRadius="full"
      borderWidth="1px"
      py="1.5"
      px="3.5"
      color={active ? 'accent.fg' : 'fg.muted'}
      fontSize="xs"
      fontWeight={active ? 'bold' : 'medium'}
      bgColor={active ? 'accent.default' : 'board.panel'}
      transition="all 0.12s"
      whiteSpace="nowrap"
      _hover={{ borderColor: 'accent.default' }}
    >
      {label}
    </Box>
  );
}

function SkeletonPanel() {
  return (
    <Grid gap="2" columns={{ base: 2, sm: 3, md: 4 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Box key={i} borderRadius="lg" h="14" bgColor="bg.muted" animation="skeleton-pulse" />
      ))}
    </Grid>
  );
}
