import { useMemo, useState } from 'react';
import { FaArrowRightArrowLeft, FaHeart, FaImage } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, Wrap, styled } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { BromideTile } from '~/components/bromide/BromideTile';
import { ProgressBar } from '~/components/bromide/Progress';
import { CollectionCard } from '~/components/collection/CollectionCard';
import { ExportDialog } from '~/components/mypick/ExportDialog';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { useOshi } from '~/hooks/useOshi';
import { useOwnership } from '~/hooks/useOwnership';
import { readableText } from '~/utils/color';
import { collectionStats, overallStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';
import type { Bromide } from '~/types';

export default function Page() {
  const catalog = useCatalog();
  const { ownership, toggle, setCount } = useOwnership();
  const { isOshi, toggleOshi } = useOshi();
  const mounted = useMounted();
  const [exportOpen, setExportOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const overall = overallStats(catalog, ownership);
  const oshiMembers = mounted ? catalog.members.filter((m) => isOshi(m.id)) : [];

  const colStats = useMemo(
    () => catalog.collections.map((c) => ({ c, stats: collectionStats(catalog, c.id, ownership) })),
    [catalog, ownership]
  );
  const almostThere = useMemo(
    () =>
      colStats
        .filter((x) => x.stats.percent > 0 && x.stats.percent < 100)
        .sort((a, b) => b.stats.percent - a.stats.percent || a.stats.missing - b.stats.missing)
        .slice(0, 3),
    [colStats]
  );
  const almostIds = new Set(almostThere.map((x) => x.c.id));
  const recent = colStats.filter((x) => !almostIds.has(x.c.id)).slice(0, 3);
  const imageNeeded = useMemo(
    () =>
      catalog.collections
        .map((c) => ({
          c,
          missing: catalog.bromides.filter((b) => b.collectionId === c.id && !b.imageUrl).length
        }))
        .filter((x) => x.missing > 0)
        .sort((a, b) => b.missing - a.missing)
        .slice(0, 3),
    [catalog]
  );

  const memberStats = useMemo(
    () =>
      catalog.members.map((m) => {
        const bs = catalog.bromides.filter((b) => b.memberId === m.id);
        const owned = bs.filter((b) => (ownership[b.id] ?? 0) >= 1).length;
        return {
          member: m,
          owned,
          total: bs.length,
          percent: bs.length ? Math.round((owned / bs.length) * 100) : 0
        };
      }),
    [catalog, ownership]
  );

  const oshiMissing = (memberId: string): Bromide[] =>
    catalog.bromides
      .filter((b) => b.memberId === memberId && (ownership[b.id] ?? 0) === 0)
      .slice(0, 8);

  const showPicker = oshiMembers.length === 0 || pickerOpen;

  return (
    <Stack gap="5">
      <Stack gap="1">
        <Heading fontSize={{ base: 'xl', md: '2xl' }}>ピュアリーモンスター ブロマイド管理</Heading>
        <Text color="fg.muted" fontSize="sm">
          所持・不足・ダブりを記録して、コンプを目指そう。ログインすると端末をまたいで同期できます。
        </Text>
      </Stack>

      {mounted && oshiMembers.length > 0 ? (
        <Stack gap="3">
          {oshiMembers.slice(0, 2).map((m) => {
            const s = memberStats.find((x) => x.member.id === m.id)!;
            const missing = oshiMissing(m.id);
            const ink = readableText(m.color);
            return (
              <Stack
                key={m.id}
                style={{ borderLeftColor: m.color }}
                gap="3"
                borderColor="board.border"
                borderLeftWidth="4px"
                borderLeftColor="transparent"
                borderRadius="2xl"
                borderWidth="1px"
                p="4"
                bgColor="board.panelSolid"
              >
                <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                  <HStack gap="2" alignItems="center">
                    <styled.span
                      style={{ backgroundColor: m.color, color: ink }}
                      display="inline-flex"
                      gap="1"
                      alignItems="center"
                      borderRadius="full"
                      py="0.5"
                      px="2"
                      fontSize="2xs"
                      fontWeight="bold"
                    >
                      <FaHeart size={8} />
                      推し
                    </styled.span>
                    <Heading fontSize="lg">{m.name}</Heading>
                  </HStack>
                  <Text color="fg.muted" fontSize="sm" fontVariantNumeric="tabular-nums">
                    {s.owned}/{s.total}・{s.percent}%
                  </Text>
                </HStack>
                <ProgressBar percent={s.percent} />
                {missing.length > 0 ? (
                  <Stack gap="2">
                    <Text color="fg.muted" fontSize="xs">
                      あと {s.total - s.owned} 枚 — タップで所持を記録
                    </Text>
                    <Grid gap="2" gridTemplateColumns="repeat(auto-fill, minmax(60px, 1fr))">
                      {missing.map((b) => (
                        <BromideTile
                          key={b.id}
                          bromide={b}
                          member={m}
                          count={ownership[b.id] ?? 0}
                          onToggle={() => toggle(b.id)}
                          onSetCount={(n) => setCount(b.id, n)}
                          size="sm"
                          showStepper={false}
                        />
                      ))}
                    </Grid>
                  </Stack>
                ) : (
                  <Badge size="sm" variant="subtle" colorPalette="green" alignSelf="flex-start">
                    コンプ済み 🎉
                  </Badge>
                )}
              </Stack>
            );
          })}
          <Box>
            <styled.button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              cursor="pointer"
              color="accent.text"
              fontSize="sm"
              fontWeight="bold"
              _hover={{ textDecoration: 'underline' }}
            >
              {pickerOpen ? '閉じる' : '推しメンを編集'}
            </styled.button>
          </Box>
        </Stack>
      ) : null}

      {showPicker ? (
        <Stack
          gap="2.5"
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          p="4"
          bgColor="board.panelSolid"
        >
          <HStack gap="1.5" alignItems="center">
            <Box color="brand.pink">
              <FaHeart size={13} />
            </Box>
            <Heading fontSize="md">推しメン</Heading>
          </HStack>
          <Text color="fg.subtle" fontSize="xs">
            推しメンを選ぶと、推しの集めかたがここに表示されます。
          </Text>
          <Wrap gap="1.5">
            {catalog.members.map((m) => {
              const oshi = mounted && isOshi(m.id);
              return (
                <styled.button
                  key={m.id}
                  type="button"
                  onClick={() => toggleOshi(m.id)}
                  aria-pressed={oshi}
                  aria-label={`${m.name}を推しに設定`}
                  style={{
                    backgroundColor: oshi ? m.color : 'transparent',
                    borderColor: m.color,
                    ...(oshi ? { color: readableText(m.color) } : {})
                  }}
                  cursor="pointer"
                  display="inline-flex"
                  gap="1"
                  alignItems="center"
                  borderRadius="full"
                  borderWidth="1.5px"
                  py="1"
                  px="2.5"
                  color="fg.default"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {oshi ? <FaHeart size={9} /> : null}
                  {m.name}
                </styled.button>
              );
            })}
          </Wrap>
        </Stack>
      ) : null}

      {mounted && almostThere.length > 0 ? (
        <Stack gap="2.5">
          <HStack gap="2" alignItems="baseline" px="1">
            <Heading fontSize="md">あと少し</Heading>
            <Text color="fg.muted" fontSize="xs">
              もう少しでコンプ
            </Text>
          </HStack>
          <Grid gap="3" alignItems="start" columns={{ base: 1, sm: 2, lg: 3 }}>
            {almostThere.map(({ c }) => (
              <CollectionCard
                key={c.id}
                catalog={catalog}
                collection={c}
                ownership={ownership}
                mounted={mounted}
              />
            ))}
          </Grid>
        </Stack>
      ) : null}

      {imageNeeded.length > 0 ? (
        <Stack gap="2.5">
          <HStack gap="2" alignItems="baseline" px="1">
            <Heading fontSize="md">画像募集中</Heading>
            <Text color="fg.muted" fontSize="xs">
              足りない画像の投稿先
            </Text>
          </HStack>
          <Grid gap="3" alignItems="start" columns={{ base: 1, sm: 2, lg: 3 }}>
            {imageNeeded.map(({ c, missing }) => (
              <Link
                key={c.id}
                href={toAppUrl(`/collections/?c=${c.id}`)}
                _hover={{ textDecoration: 'none' }}
              >
                <Stack
                  gap="2"
                  borderColor="board.border"
                  borderRadius="lg"
                  borderWidth="1px"
                  p="3"
                  bgColor="board.panelSolid"
                  _hover={{ borderColor: 'accent.default', transform: 'translateY(-1px)' }}
                >
                  <HStack gap="2" justifyContent="space-between" alignItems="center">
                    <HStack gap="1.5" minW="0">
                      <Box color="accent.text">
                        <FaImage size={13} />
                      </Box>
                      <Text fontSize="sm" fontWeight="bold" truncate>
                        {c.title}
                      </Text>
                    </HStack>
                    <Badge size="sm" variant="subtle" colorPalette="amber">
                      {missing}枚
                    </Badge>
                  </HStack>
                  <Text color="fg.muted" fontSize="xs">
                    コレクションを開いて、画像のないカードから投稿できます。
                  </Text>
                </Stack>
              </Link>
            ))}
          </Grid>
        </Stack>
      ) : null}

      <Stack
        gap="2.5"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p="4"
        bgColor="board.panelSolid"
      >
        <HStack justifyContent="space-between" alignItems="baseline">
          <Heading fontSize="md">メンバー別</Heading>
          <Text color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
            全体{' '}
            {mounted
              ? `${overall.owned}/${overall.total}・${overall.percent}%`
              : `全${overall.total}`}
          </Text>
        </HStack>
        <Stack gap="2">
          {memberStats.map(({ member, owned, total, percent }) => {
            const oshi = mounted && isOshi(member.id);
            return (
              <HStack key={member.id} gap="3">
                <HStack gap="1.5" flexShrink="0" w="24" minW="24">
                  <Box
                    style={{ backgroundColor: member.color }}
                    flexShrink="0"
                    borderRadius="full"
                    w="2.5"
                    h="2.5"
                  />
                  <Text fontSize="xs" fontWeight={oshi ? 'bold' : 'medium'} truncate>
                    {member.name}
                  </Text>
                </HStack>
                <Box
                  position="relative"
                  flex="1"
                  borderRadius="full"
                  h="2"
                  bgColor="bg.muted"
                  overflow="hidden"
                >
                  <Box
                    style={{ width: `${mounted ? percent : 0}%`, backgroundColor: member.color }}
                    inset="0"
                    position="absolute"
                    borderRadius="full"
                  />
                </Box>
                <Text
                  minW="16"
                  color="fg.muted"
                  fontSize="xs"
                  fontVariantNumeric="tabular-nums"
                  textAlign="right"
                >
                  {mounted ? `${owned}/${total}・${percent}%` : `${total}`}
                </Text>
              </HStack>
            );
          })}
        </Stack>
      </Stack>

      <Stack gap="2.5">
        <HStack justifyContent="space-between" alignItems="baseline" px="1">
          <Heading fontSize="md">コレクション</Heading>
          <Link href={toAppUrl('/collections')} color="accent.text" fontSize="sm" fontWeight="bold">
            すべて見る →
          </Link>
        </HStack>
        <Grid gap="3" alignItems="start" columns={{ base: 1, sm: 2, lg: 3 }}>
          {recent.map(({ c }) => (
            <CollectionCard
              key={c.id}
              catalog={catalog}
              collection={c}
              ownership={ownership}
              mounted={mounted}
            />
          ))}
        </Grid>
      </Stack>

      <HStack
        gap="3"
        justifyContent="space-between"
        alignItems="center"
        borderColor="board.border"
        borderTopWidth="1px"
        pt="4"
        flexWrap="wrap"
      >
        <Link
          href={toAppUrl('/trade')}
          color="fg.muted"
          fontSize="sm"
          _hover={{ color: 'accent.text' }}
        >
          <HStack gap="1.5" alignItems="center">
            <FaArrowRightArrowLeft size={12} />
            譲渡テキストをつくる →
          </HStack>
        </Link>
        {mounted && overall.owned > 0 ? (
          <Button size="sm" variant="subtle" onClick={() => setExportOpen(true)}>
            <FaImage />
            進捗を画像で保存
          </Button>
        ) : null}
      </HStack>

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
