import { FaCircleCheck } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection, OwnershipMap } from '~/types';
import { bromideLabel, missingBromides } from '~/utils/stats';

interface MissingViewProps {
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

export function MissingView({ catalog, ownership, collections, memberFilter }: MissingViewProps) {
  const groups = collections
    .map((c) => ({
      collection: c,
      items: missingBromides(catalog, ownership, c.id).filter((b) => passesMember(b, memberFilter))
    }))
    .filter((g) => g.items.length > 0);

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
        <Box color="green.9" fontSize="3xl">
          <FaCircleCheck />
        </Box>
        <Text fontWeight="bold">不足はありません</Text>
        <Text color="fg.muted" fontSize="sm">
          この条件のブロマイドはすべて所持しています。
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="6">
      {groups.map(({ collection, items }) => (
        <Stack key={collection.id} gap="2.5">
          <HStack justifyContent="space-between" alignItems="baseline">
            <Text fontSize="sm" fontWeight="bold">
              {collection.title}
            </Text>
            <Badge size="sm" variant="subtle" colorPalette="gray">
              不足 {items.length}
            </Badge>
          </HStack>
          <Grid gap="2" columns={{ base: 2, sm: 3, md: 4 }}>
            {items.map((b) => {
              const color = b.memberId ? memberColorOf(catalog, b.memberId) : '#FF5FA2';
              return (
                <HStack
                  key={b.id}
                  gap="2"
                  alignItems="center"
                  borderColor="board.border"
                  borderRadius="lg"
                  borderWidth="1px"
                  minW="0"
                  py="2"
                  px="2.5"
                  bgColor="board.missing"
                  borderStyle="dashed"
                >
                  <Box
                    style={{ backgroundColor: color }}
                    flexShrink="0"
                    borderRadius="full"
                    w="2"
                    h="full"
                    minH="8"
                  />
                  <Stack gap="0" minW="0">
                    <Text fontSize="sm" fontWeight="medium" truncate>
                      {memberShort(catalog, b)}
                    </Text>
                    <Text color="fg.muted" fontSize="2xs" fontVariantNumeric="tabular-nums">
                      No.{b.no}
                    </Text>
                  </Stack>
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
  const m = catalog.members.find((x) => x.id === b.memberId);
  return m?.nickname ?? bromideLabel(catalog, b);
}
