import { useState } from 'react';
import { FaArrowRightArrowLeft, FaHeart, FaImage, FaLayerGroup } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, Wrap, styled } from 'styled-system/jsx';
import { readableText } from '~/utils/color';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { ProgressBar } from '~/components/bromide/Progress';
import { CollectionCard } from '~/components/collection/CollectionCard';
import { ExportDialog } from '~/components/mypick/ExportDialog';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { useOshi } from '~/hooks/useOshi';
import { useOwnership } from '~/hooks/useOwnership';
import { overallStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

export default function Page() {
  const catalog = useCatalog();
  const { ownership } = useOwnership();
  const { isOshi, toggleOshi } = useOshi();
  const mounted = useMounted();
  const [exportOpen, setExportOpen] = useState(false);
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
    <Stack gap="4">
      <Stack gap="1">
        <Heading fontSize={{ base: 'xl', md: '2xl' }}>ピュアリーモンスター ブロマイド管理</Heading>
        <Text color="fg.muted" fontSize="sm">
          所持・不足・ダブりを記録して、譲渡テキストもワンタップ。ログインなしで使えます。
        </Text>
      </Stack>

      <Stack
        gap="3"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p="4"
        bgColor="board.panelSolid"
      >
        <HStack justifyContent="space-between" alignItems="baseline">
          <Text fontSize="sm" fontWeight="bold">
            全体の進捗
          </Text>
          <Text color="fg.muted" fontSize="sm" fontVariantNumeric="tabular-nums">
            {mounted ? `${overall.owned} / ${overall.total} 枚` : `全 ${overall.total} 枚`}
          </Text>
        </HStack>
        <ProgressBar percent={mounted ? overall.percent : 0} />
        {mounted && overall.owned > 0 ? (
          <Button
            size="sm"
            variant="subtle"
            onClick={() => setExportOpen(true)}
            alignSelf="flex-start"
          >
            <FaImage />
            進捗を画像で保存
          </Button>
        ) : null}
      </Stack>

      <Grid gap="2" columns={{ base: 1, sm: 2 }}>
        <ActionButton
          href={toAppUrl('/collections')}
          icon={<FaLayerGroup />}
          label="コレクションを記録する"
          primary
        />
        <ActionButton
          href={toAppUrl('/trade')}
          icon={<FaArrowRightArrowLeft />}
          label="譲渡をつくる"
        />
      </Grid>

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
        <Wrap gap="1.5">
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
                {m.nickname}
              </styled.button>
            );
          })}
        </Wrap>
        {oshiMembers.length > 0 ? (
          <Stack gap="2" pt="1">
            {oshiMembers.map((m) => {
              const s = memberStat(m.id);
              return (
                <HStack key={m.id} gap="3">
                  <styled.span
                    style={{ backgroundColor: m.color, color: readableText(m.color) }}
                    display="inline-flex"
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="full"
                    minW="20"
                    py="0.5"
                    px="2.5"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {m.nickname}
                  </styled.span>
                  <Box
                    position="relative"
                    flex="1"
                    borderRadius="full"
                    h="2"
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
        ) : (
          <Text color="fg.subtle" fontSize="xs">
            タップで推しメンを設定すると、推しの進捗が表示されます。
          </Text>
        )}
      </Stack>

      <Stack gap="2.5">
        <HStack justifyContent="space-between" alignItems="baseline" px="1">
          <Heading fontSize="md">コレクション</Heading>
          <Link
            href={toAppUrl('/collections')}
            color="accent.default"
            fontSize="sm"
            fontWeight="bold"
          >
            すべて見る →
          </Link>
        </HStack>
        <Grid gap="3" alignItems="start" columns={{ base: 1, sm: 2, lg: 3 }}>
          {catalog.collections.map((c) => (
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

function ActionButton({
  href,
  icon,
  label,
  primary
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} _hover={{ textDecoration: 'none' }}>
      <Button variant={primary ? 'solid' : 'outline'} size="md" gap="2" w="full">
        {icon}
        {label}
      </Button>
    </Link>
  );
}
