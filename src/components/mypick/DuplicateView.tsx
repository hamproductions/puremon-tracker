import { FaArrowRightArrowLeft, FaLayerGroup } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection, OwnershipMap } from '~/types';
import { duplicateBromides } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

interface DuplicateViewProps {
  catalog: Catalog;
  ownership: OwnershipMap;
  collections: Collection[];
  memberFilter: Set<string>;
}

function passesMember(b: Bromide, memberFilter: Set<string>): boolean {
  if (memberFilter.size === 0) return true;
  if (b.memberId === null) return true;
  return memberFilter.has(b.memberId);
}

export function DuplicateView({
  catalog,
  ownership,
  collections,
  memberFilter
}: DuplicateViewProps) {
  const groups = collections
    .map((c) => ({
      collection: c,
      items: duplicateBromides(catalog, ownership, c.id).filter((e) =>
        passesMember(e.bromide, memberFilter)
      )
    }))
    .filter((g) => g.items.length > 0);

  const totalExtra = groups.reduce(
    (acc, g) => acc + g.items.reduce((a, e) => a + (e.count - 1), 0),
    0
  );

  if (groups.length === 0) {
    return (
      <Stack
        gap="2"
        alignItems="center"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        py="10"
        textAlign="center"
        bgColor="board.panel"
      >
        <Box color="fg.subtle" fontSize="3xl">
          <FaLayerGroup />
        </Box>
        <Text fontWeight="bold">ダブりはありません</Text>
        <Text color="fg.muted" fontSize="sm">
          この条件で2枚以上所持しているブロマイドはありません。
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="6">
      <HStack
        gap="3"
        justifyContent="space-between"
        borderColor="board.border"
        borderRadius="xl"
        borderWidth="1px"
        py="3"
        px="4"
        bgColor="board.panel"
        flexWrap="wrap"
      >
        <Text color="fg.muted" fontSize="sm">
          交換に出せる余剰{' '}
          <Text as="span" color="fg.default" fontWeight="bold">
            {totalExtra}
          </Text>{' '}
          枚
        </Text>
        <Link href={toAppUrl('/trade')} _hover={{ textDecoration: 'none' }}>
          <Button size="sm" variant="outline">
            <FaArrowRightArrowLeft />
            ダブりを交換する
          </Button>
        </Link>
      </HStack>

      {groups.map(({ collection, items }) => (
        <Stack key={collection.id} gap="2.5">
          <HStack justifyContent="space-between" alignItems="baseline">
            <Text fontSize="sm" fontWeight="bold">
              {collection.title}
            </Text>
            <Badge size="sm" variant="subtle" colorPalette="amber">
              ダブり {items.reduce((a, e) => a + (e.count - 1), 0)}
            </Badge>
          </HStack>
          <Grid gap="2" columns={{ base: 2, sm: 3, md: 4 }}>
            {items.map(({ bromide, count }) => {
              const color = bromide.memberId ? memberColorOf(catalog, bromide.memberId) : '#FF5FA2';
              return (
                <HStack
                  key={bromide.id}
                  gap="2"
                  alignItems="center"
                  borderColor="board.dupBorder"
                  borderRadius="lg"
                  borderWidth="1px"
                  minW="0"
                  py="2"
                  px="2.5"
                  bgColor="board.dup"
                >
                  <Box
                    style={{ backgroundColor: color }}
                    flexShrink="0"
                    borderRadius="full"
                    w="2"
                    minH="8"
                  />
                  <Stack flex="1" gap="0" minW="0">
                    <Text fontSize="sm" fontWeight="medium" truncate>
                      {memberShort(catalog, bromide)}
                    </Text>
                    <Text color="fg.muted" fontSize="2xs" fontVariantNumeric="tabular-nums">
                      {bromide.size ? `${bromide.size}・` : ''}No.{bromide.no}
                    </Text>
                  </Stack>
                  <Box
                    style={{ backgroundColor: color }}
                    flexShrink="0"
                    borderRadius="full"
                    py="0.5"
                    px="2"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                    fontVariantNumeric="tabular-nums"
                  >
                    ×{count}
                  </Box>
                </HStack>
              );
            })}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}

function memberColorOf(catalog: Catalog, memberId: string): string {
  return catalog.members.find((m) => m.id === memberId)?.color ?? '#FF5FA2';
}

function memberShort(catalog: Catalog, b: Bromide): string {
  if (!b.memberId) return '集合';
  return catalog.members.find((x) => x.id === b.memberId)?.nickname ?? `No.${b.no}`;
}
