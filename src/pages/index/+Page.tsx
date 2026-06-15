import { FaArrowRightArrowLeft, FaLayerGroup, FaStar } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { useCatalog } from '~/hooks/useCatalog';
import { useOwnership } from '~/hooks/useOwnership';
import { useMounted } from '~/hooks/useMounted';
import { collectionStats, overallStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

export default function Page() {
  const catalog = useCatalog();
  const { ownership } = useOwnership();
  const mounted = useMounted();
  const overall = overallStats(catalog, ownership);

  return (
    <Stack gap="8" pt="2">
      <Stack gap="4" alignItems="center" py={{ base: '4', md: '8' }} textAlign="center">
        <Badge size="lg" variant="subtle" colorPalette="pink">
          ピュアリーモンスター 非公式ファンツール
        </Badge>
        <Heading textStyle="display" fontSize={{ base: '3xl', md: '5xl' }} lineHeight="1.1">
          ブロマイドを、
          <br />
          スマートに集めよう。
        </Heading>
        <Text maxW="2xl" color="fg.muted" fontSize={{ base: 'sm', md: 'md' }}>
          所持・未所持の記録、不足の確認、ダブりの管理から譲渡テキストの作成まで。
          ログインなし・オフラインでもすぐに使えます。
        </Text>
        <Wrap gap="1.5" justify="center" maxW="2xl">
          {catalog.members.map((m) => (
            <HStack
              key={m.id}
              gap="1.5"
              borderColor="board.border"
              borderRadius="full"
              borderWidth="1px"
              py="1"
              px="2.5"
              bgColor="board.panel"
            >
              <Box style={{ backgroundColor: m.color }} borderRadius="full" w="2.5" h="2.5" />
              <Text fontSize="xs" fontWeight="medium">
                {m.nickname}
              </Text>
            </HStack>
          ))}
        </Wrap>
        <HStack gap="2" justifyContent="center" flexWrap="wrap">
          <Link href={toAppUrl('/collections')} _hover={{ textDecoration: 'none' }}>
            <Button size="lg">
              <FaLayerGroup />
              コレクションを見る
            </Button>
          </Link>
          <Link href={toAppUrl('/mypick')} _hover={{ textDecoration: 'none' }}>
            <Button size="lg" variant="outline">
              <FaStar />
              マイコレを管理
            </Button>
          </Link>
        </HStack>
      </Stack>

      <Box
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p={{ base: '4', md: '6' }}
        bgColor="board.panel"
        backdropFilter="blur(8px)"
      >
        <HStack justifyContent="space-between" alignItems="baseline" mb="3">
          <Heading fontSize="lg">コレクション進捗</Heading>
          <Text color="fg.muted" fontSize="sm">
            {mounted ? `${overall.owned} / ${overall.total} 枚` : `全 ${overall.total} 枚`}
          </Text>
        </HStack>
        <Box
          position="relative"
          borderRadius="full"
          h="2.5"
          mb="4"
          bgColor="bg.muted"
          overflow="hidden"
        >
          <Box
            style={{ width: `${mounted ? overall.percent : 0}%` }}
            position="absolute"
            top="0"
            left="0"
            borderRadius="full"
            h="full"
            bgGradient="to-r"
            gradientFrom="pink.9"
            gradientTo="purple.9"
            transition="width 0.4s ease"
          />
        </Box>
        <Grid gap="3" columns={{ base: 1, sm: 2, lg: 3 }}>
          {catalog.collections.map((c) => {
            const s = collectionStats(catalog, c.id, ownership);
            return (
              <Link
                key={c.id}
                href={toAppUrl(`/collections?c=${c.id}`)}
                _hover={{ textDecoration: 'none' }}
              >
                <Stack
                  gap="1.5"
                  borderColor="board.border"
                  borderRadius="xl"
                  borderWidth="1px"
                  h="full"
                  p="3.5"
                  bgColor="board.tile"
                  transition="border-color 0.15s"
                  _hover={{ borderColor: 'accent.default' }}
                >
                  <Text fontWeight="bold" lineHeight="1.3">
                    {c.title}
                  </Text>
                  <Text color="fg.muted" fontSize="xs">
                    {c.kind === 'flat' ? '集合' : `${c.memberIds.length}人`} ・ 全 {s.total} 枚
                  </Text>
                  <HStack gap="2" mt="auto" pt="1">
                    <Badge size="sm" variant={mounted && s.owned > 0 ? 'solid' : 'outline'}>
                      {mounted ? `${s.percent}%` : '—'}
                    </Badge>
                    {mounted && s.duplicates > 0 ? (
                      <Badge size="sm" variant="subtle" colorPalette="amber">
                        ダブり {s.duplicates}
                      </Badge>
                    ) : null}
                  </HStack>
                </Stack>
              </Link>
            );
          })}
        </Grid>
      </Box>

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
          <Heading fontSize="md">ダブりは交換しよう</Heading>
          <Text color="fg.muted" fontSize="sm">
            所持データから譲渡・求めるリストのテキストを自動生成します。
          </Text>
        </Stack>
        <Link href={toAppUrl('/trade')} _hover={{ textDecoration: 'none' }}>
          <Button variant="outline">
            <FaArrowRightArrowLeft />
            譲渡テキストを作る
          </Button>
        </Link>
      </HStack>
    </Stack>
  );
}
