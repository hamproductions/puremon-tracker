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

const Img = styled('img');

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
      <Stack
        gap="0"
        borderColor="board.border"
        borderRadius="3xl"
        borderWidth="1px"
        bgColor="board.panelSolid"
        overflow="hidden"
      >
        <Box position="relative" w="full" h={{ base: '150px', md: '220px' }} bgColor="board.tile">
          <Img
            src={toAppUrl('/pm-group.jpg')}
            alt="ピュアリーモンスター"
            inset="0"
            position="absolute"
            objectPosition="center 30%"
            objectFit="cover"
            w="full"
            h="full"
          />
        </Box>
        <Stack gap="4" alignItems="center" py="6" px={{ base: '5', md: '8' }} textAlign="center">
          <Img
            src={toAppUrl('/purelymonster-logo.png')}
            alt="ピュアリーモンスター"
            w={{ base: '160px', md: '210px' }}
            h="auto"
            mt={{ base: '-12', md: '-16' }}
            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.25))"
          />
          <Stack gap="1">
            <Heading fontSize={{ base: 'lg', md: 'xl' }}>ブロマイド管理＆交換ツール</Heading>
            <Text maxW="xl" color="fg.muted" fontSize="sm">
              所持・ダブり・不足の記録から譲渡テキストまで。ログインなしですぐ使えます。
            </Text>
          </Stack>

          <Stack gap="1.5" alignItems="center">
            <Wrap gap="1.5" justify="center" maxW="3xl">
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
                      backgroundColor: oshi ? m.color : 'transparent',
                      color: oshi ? '#fff' : m.color,
                      borderColor: m.color
                    }}
                    cursor="pointer"
                    display="inline-flex"
                    gap="1"
                    alignItems="center"
                    borderRadius="full"
                    borderWidth="1.5px"
                    py="1"
                    px="2.5"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {oshi ? <FaHeart size={9} /> : null}
                    {m.nickname}
                  </styled.button>
                );
              })}
            </Wrap>
            <Text color="fg.subtle" fontSize="2xs">
              ♡ タップで推しメンを設定
            </Text>
          </Stack>

          <HStack gap="2.5" justifyContent="center" flexWrap="wrap">
            <Link href={toAppUrl('/collections')} _hover={{ textDecoration: 'none' }}>
              <Button size="md" borderRadius="full" px="6">
                <FaLayerGroup />
                コレクションを見る
              </Button>
            </Link>
            <Link href={toAppUrl('/mypick')} _hover={{ textDecoration: 'none' }}>
              <Button size="md" variant="outline" borderRadius="full" px="5">
                <FaRegStar />
                マイコレ
              </Button>
            </Link>
          </HStack>
        </Stack>
      </Stack>

      <Grid gap="3" columns={{ base: 2, md: 4 }}>
        <StatCard
          label="所持"
          value={mounted ? `${overall.owned}` : '—'}
          unit={`/ ${overall.total}`}
        />
        <StatCard label="コンプ率" value={mounted ? `${overall.percent}` : '—'} unit="%" />
        <StatCard label="不足" value={mounted ? `${overall.missing}` : '—'} unit="枚" />
        <StatCard label="ダブり" value={mounted ? `${overall.duplicates}` : '—'} unit="枚" />
      </Grid>

      {oshiMembers.length > 0 ? (
        <Stack
          gap="3"
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          p={{ base: '4', md: '5' }}
          bgColor="board.panelSolid"
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
            color="accent.default"
            fontSize="sm"
            fontWeight="bold"
          >
            すべて見る →
          </Link>
        </HStack>
        <Grid gap="3" columns={{ base: 1, sm: 2, lg: 3 }}>
          {catalog.collections.map((c) => {
            const s = collectionStats(catalog, c.id, ownership);
            const dots = (
              c.memberIds.length
                ? c.memberIds.map(
                    (id) => catalog.members.find((m) => m.id === id)?.color ?? '#cbd5e1'
                  )
                : ['#2196f3']
            ).slice(0, 7);
            return (
              <Link
                key={c.id}
                href={toAppUrl(`/collections?c=${c.id}`)}
                _hover={{ textDecoration: 'none' }}
              >
                <Stack
                  gap="2.5"
                  borderColor="board.border"
                  borderRadius="2xl"
                  borderWidth="1px"
                  h="full"
                  p="4"
                  bgColor="board.panelSolid"
                  transition="border-color 0.15s"
                  _hover={{ borderColor: 'accent.default' }}
                >
                  <HStack gap="2" justifyContent="space-between" alignItems="flex-start">
                    <Text fontWeight="bold" lineHeight="1.3">
                      {c.title}
                    </Text>
                    <HStack gap="0.5" flexShrink="0" pt="1">
                      {dots.map((color, i) => (
                        <Box
                          key={i}
                          style={{ backgroundColor: color }}
                          borderRadius="full"
                          w="1.5"
                          h="1.5"
                        />
                      ))}
                    </HStack>
                  </HStack>
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
                    mt="auto"
                    bgColor="bg.muted"
                    overflow="hidden"
                  >
                    <Box
                      style={{ width: `${mounted ? s.percent : 0}%` }}
                      inset="0"
                      position="absolute"
                      borderRadius="full"
                      bgColor="accent.default"
                    />
                  </Box>
                  <HStack justifyContent="space-between">
                    <Text color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
                      {mounted ? `${s.owned}/${s.total}` : `全${s.total}`}
                    </Text>
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette={mounted && s.percent === 100 ? 'green' : 'blue'}
                    >
                      {mounted ? `${s.percent}%` : '—'}
                    </Badge>
                  </HStack>
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
          bgColor="board.panelSolid"
          flexWrap="wrap"
        >
          <HStack gap="3">
            <Center
              flexShrink="0"
              borderRadius="full"
              w="11"
              h="11"
              color="accent.text"
              bgColor="accent.subtle"
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

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Stack
      gap="0.5"
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      p="4"
      bgColor="board.panelSolid"
    >
      <Text color="fg.muted" fontSize="xs" fontWeight="medium">
        {label}
      </Text>
      <HStack gap="1" alignItems="baseline">
        <Text textStyle="display" color="accent.default" fontSize="2xl" lineHeight="1">
          {value}
        </Text>
        <Text color="fg.muted" fontSize="xs">
          {unit}
        </Text>
      </HStack>
    </Stack>
  );
}
