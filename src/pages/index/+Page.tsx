import { FaArrowRightArrowLeft, FaHeart, FaLayerGroup, FaRegStar } from 'react-icons/fa6';
import { Box, Center, Grid, HStack, Stack, Wrap, styled } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { useOshi } from '~/hooks/useOshi';
import { useOwnership } from '~/hooks/useOwnership';
import { collectionStats, overallStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

export default function Page() {
  const catalog = useCatalog();
  const { ownership } = useOwnership();
  const { isOshi, toggleOshi } = useOshi();
  const mounted = useMounted();
  const overall = overallStats(catalog, ownership);

  const memberStat = (memberId: string) => {
    const bs = catalog.bromides.filter((b) => b.memberId === memberId);
    const owned = bs.filter((b) => (ownership[b.id] ?? 0) >= 1).length;
    return {
      owned,
      total: bs.length,
      percent: bs.length ? Math.round((owned / bs.length) * 100) : 0
    };
  };
  const oshiMembers = mounted ? catalog.members.filter((m) => isOshi(m.id)) : [];

  return (
    <Stack gap="6" pt="1">
      <Box
        position="relative"
        borderColor="board.border"
        borderRadius="3xl"
        borderWidth="1px"
        py={{ base: '8', md: '12' }}
        px={{ base: '5', md: '10' }}
        overflow="hidden"
        bgGradient="to-b"
        gradientFrom="board.panelSolid"
        gradientTo="board.tile"
        boxShadow="0 18px 50px -28px rgba(54,150,220,0.45)"
      >
        <Box
          style={{
            background:
              'radial-gradient(circle at 85% 10%, rgba(255,95,162,0.22), transparent 45%), radial-gradient(circle at 12% 90%, rgba(54,197,240,0.22), transparent 45%)'
          }}
          inset="0"
          position="absolute"
          pointerEvents="none"
        />
        <Stack position="relative" gap="5" alignItems="center" textAlign="center">
          <Badge size="md" variant="subtle" colorPalette="sky" borderRadius="full" px="3">
            ピュアリーモンスター 非公式ファンツール
          </Badge>
          <Heading
            textStyle="display"
            color="fg.default"
            fontSize={{ base: '4xl', md: '6xl' }}
            lineHeight="1.05"
          >
            ブロマイド、
            <Box
              as="span"
              style={{
                background: 'linear-gradient(90deg, #36c5f0, #ff5fa2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
              display="inline-block"
            >
              ぜんぶ集めよ。
            </Box>
          </Heading>
          <Text maxW="2xl" color="fg.muted" fontSize={{ base: 'sm', md: 'md' }}>
            所持・ダブり・不足をかわいく管理して、譲渡テキストもワンタップ。
            <br />
            ログインなし・オフラインでもすぐ使えます。
          </Text>

          <Stack gap="1.5" alignItems="center">
            <Wrap gap="2" justify="center" maxW="3xl">
              {catalog.members.map((m) => {
                const oshi = mounted && isOshi(m.id);
                return (
                  <styled.button
                    key={m.id}
                    type="button"
                    onClick={() => toggleOshi(m.id)}
                    aria-pressed={oshi}
                    aria-label={`${m.nickname}を推しに設定`}
                    style={{
                      backgroundColor: oshi ? m.color : `${m.color}26`,
                      color: oshi ? '#fff' : m.color
                    }}
                    cursor="pointer"
                    display="inline-flex"
                    gap="1"
                    alignItems="center"
                    borderRadius="full"
                    py="1.5"
                    px="3"
                    fontSize="xs"
                    fontWeight="bold"
                    boxShadow={oshi ? 'sm' : 'none'}
                    transition="transform 0.12s"
                    _hover={{ transform: 'translateY(-1px)' }}
                  >
                    {oshi ? <FaHeart size={10} /> : null}
                    {m.nickname}
                  </styled.button>
                );
              })}
            </Wrap>
            <Text color="fg.subtle" fontSize="2xs">
              ♡ タップで推しメンを設定
            </Text>
          </Stack>

          <HStack gap="3" justifyContent="center" pt="1" flexWrap="wrap">
            <Link href={toAppUrl('/collections')} _hover={{ textDecoration: 'none' }}>
              <Button size="lg" borderRadius="full" px="7">
                <FaLayerGroup />
                コレクションを見る
              </Button>
            </Link>
            <Link href={toAppUrl('/mypick')} _hover={{ textDecoration: 'none' }}>
              <Button size="lg" variant="outline" borderRadius="full" px="6">
                <FaRegStar />
                マイコレ
              </Button>
            </Link>
          </HStack>
        </Stack>
      </Box>

      <Grid gap="3" columns={{ base: 2, md: 4 }}>
        <StatCard
          label="所持"
          value={mounted ? `${overall.owned}` : '—'}
          unit={`/ ${overall.total}`}
          accent="#36c5f0"
        />
        <StatCard
          label="コンプ率"
          value={mounted ? `${overall.percent}` : '—'}
          unit="%"
          accent="#ff5fa2"
        />
        <StatCard
          label="不足"
          value={mounted ? `${overall.missing}` : '—'}
          unit="枚"
          accent="#9b8cff"
        />
        <StatCard
          label="ダブり"
          value={mounted ? `${overall.duplicates}` : '—'}
          unit="枚"
          accent="#ffb020"
        />
      </Grid>

      {oshiMembers.length > 0 ? (
        <Stack
          gap="3"
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          p={{ base: '4', md: '5' }}
          bgColor="board.panelSolid"
          boxShadow="0 8px 22px -18px rgba(30,90,150,0.5)"
        >
          <HStack gap="1.5" color="brand.pink">
            <FaHeart size={13} />
            <Heading fontSize="md">推しの進捗</Heading>
          </HStack>
          <Stack gap="2.5">
            {oshiMembers.map((m) => {
              const s = memberStat(m.id);
              return (
                <HStack key={m.id} gap="3">
                  <styled.span
                    style={{ backgroundColor: m.color }}
                    display="inline-flex"
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="full"
                    minW="20"
                    py="0.5"
                    px="2.5"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {m.nickname}
                  </styled.span>
                  <Box
                    position="relative"
                    flex="1"
                    borderRadius="full"
                    h="2.5"
                    bgColor="bg.muted"
                    overflow="hidden"
                  >
                    <Box
                      style={{ width: `${s.percent}%`, backgroundColor: m.color }}
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
                    {s.owned}/{s.total}・{s.percent}%
                  </Text>
                </HStack>
              );
            })}
          </Stack>
        </Stack>
      ) : null}

      <Stack gap="3">
        <HStack justifyContent="space-between" alignItems="baseline" px="1">
          <Heading fontSize="lg">コレクション</Heading>
          <Link
            href={toAppUrl('/collections')}
            color="accent.text"
            fontSize="sm"
            fontWeight="medium"
          >
            すべて見る →
          </Link>
        </HStack>
        <Grid gap="3" columns={{ base: 1, sm: 2, lg: 3 }}>
          {catalog.collections.map((c) => {
            const s = collectionStats(catalog, c.id, ownership);
            const cover = c.memberIds.length
              ? c.memberIds
                  .map((id) => catalog.members.find((m) => m.id === id)?.color ?? '#cbd5e1')
                  .slice(0, 7)
              : ['#36c5f0', '#ff5fa2'];
            return (
              <Link
                key={c.id}
                href={toAppUrl(`/collections?c=${c.id}`)}
                _hover={{ textDecoration: 'none' }}
              >
                <Stack
                  gap="0"
                  borderColor="board.border"
                  borderRadius="2xl"
                  borderWidth="1px"
                  h="full"
                  bgColor="board.panelSolid"
                  boxShadow="0 8px 24px -18px rgba(30,90,150,0.5)"
                  overflow="hidden"
                  transition="transform 0.15s, box-shadow 0.15s"
                  _hover={{
                    transform: 'translateY(-3px)',
                    boxShadow: '0 16px 30px -18px rgba(30,90,150,0.6)'
                  }}
                >
                  <Box
                    style={{ background: `linear-gradient(90deg, ${cover.join(', ')})` }}
                    w="full"
                    h="2.5"
                  />
                  <Stack gap="2.5" p="4">
                    <Text fontWeight="bold" lineHeight="1.3">
                      {c.title}
                    </Text>
                    <HStack gap="2" color="fg.muted" fontSize="xs">
                      <Text fontSize="xs">
                        {c.kind === 'flat' ? '集合' : `${c.memberIds.length}人`}
                      </Text>
                      <Text fontSize="xs">・全 {s.total} 枚</Text>
                      {c.sizes?.length ? <Text fontSize="xs">・{c.sizes.join('/')}</Text> : null}
                    </HStack>
                    <Box
                      position="relative"
                      borderRadius="full"
                      h="2"
                      bgColor="bg.muted"
                      overflow="hidden"
                    >
                      <Box
                        style={{ width: `${mounted ? s.percent : 0}%` }}
                        inset="0"
                        position="absolute"
                        borderRadius="full"
                        bgGradient="to-r"
                        gradientFrom="brand.sky"
                        gradientTo="brand.pink"
                      />
                    </Box>
                    <HStack justifyContent="space-between">
                      <Text color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
                        {mounted ? `${s.owned}/${s.total}` : `全${s.total}`}
                      </Text>
                      <Badge
                        size="sm"
                        variant={mounted && s.percent === 100 ? 'solid' : 'subtle'}
                        colorPalette={s.percent === 100 ? 'green' : 'sky'}
                      >
                        {mounted ? `${s.percent}%` : '—'}
                      </Badge>
                    </HStack>
                  </Stack>
                </Stack>
              </Link>
            );
          })}
        </Grid>
      </Stack>

      <Link href={toAppUrl('/trade')} _hover={{ textDecoration: 'none' }}>
        <HStack
          gap="3"
          justifyContent="space-between"
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          p={{ base: '4', md: '5' }}
          bgGradient="to-r"
          gradientFrom="board.tile"
          gradientTo="board.panelSolid"
          flexWrap="wrap"
        >
          <HStack gap="3">
            <Center
              style={{ background: 'linear-gradient(135deg, #36c5f0, #ff5fa2)' }}
              flexShrink="0"
              borderRadius="full"
              w="11"
              h="11"
              color="white"
            >
              <FaArrowRightArrowLeft />
            </Center>
            <Stack gap="0.5">
              <Text fontWeight="bold">ダブりを交換しよう</Text>
              <Text color="fg.muted" fontSize="sm">
                所持データから譲・求テキストを自動生成
              </Text>
            </Stack>
          </HStack>
          <Button variant="subtle" borderRadius="full">
            譲渡テキストを作る →
          </Button>
        </HStack>
      </Link>
    </Stack>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <Stack
      gap="0.5"
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      p="4"
      bgColor="board.panelSolid"
      boxShadow="0 8px 22px -18px rgba(30,90,150,0.5)"
    >
      <Text color="fg.muted" fontSize="xs" fontWeight="medium">
        {label}
      </Text>
      <HStack gap="1" alignItems="baseline">
        <Text textStyle="display" style={{ color: accent }} fontSize="2xl" lineHeight="1">
          {value}
        </Text>
        <Text color="fg.muted" fontSize="xs">
          {unit}
        </Text>
      </HStack>
    </Stack>
  );
}
