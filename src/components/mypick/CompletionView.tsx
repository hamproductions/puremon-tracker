import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Card } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { ProgressBar, StatPills } from '~/components/bromide/Progress';
import { bromideId, collectionSizes } from '~/data/catalog';
import type { Catalog, Collection, OwnershipMap } from '~/types';
import { collectionStats, memberMap } from '~/utils/stats';

interface CompletionViewProps {
  catalog: Catalog;
  ownership: OwnershipMap;
  collections: Collection[];
  memberFilter: Set<string>;
}

interface MemberCell {
  id: string;
  nickname: string;
  color: string;
  owned: number;
  total: number;
}

function memberCells(
  catalog: Catalog,
  collection: Collection,
  ownership: OwnershipMap,
  memberFilter: Set<string>
): MemberCell[] {
  const mm = memberMap(catalog);
  const sizes = collectionSizes(collection);
  return collection.memberIds
    .filter((id) => memberFilter.size === 0 || memberFilter.has(id))
    .map((id) => {
      const m = mm.get(id);
      let owned = 0;
      let total = 0;
      for (const no of collection.numbers) {
        for (const sz of sizes) {
          total += 1;
          if ((ownership[bromideId(collection.id, id, no, sz)] ?? 0) >= 1) owned += 1;
        }
      }
      return {
        id,
        nickname: m?.nickname ?? id,
        color: m?.color ?? '#FF5FA2',
        owned,
        total
      };
    });
}

export function CompletionView({
  catalog,
  ownership,
  collections,
  memberFilter
}: CompletionViewProps) {
  return (
    <Grid gap="4" columns={{ base: 1, lg: 2 }}>
      {collections.map((c) => {
        const s = collectionStats(catalog, c.id, ownership);
        const cells =
          c.kind === 'member_grid' ? memberCells(catalog, c, ownership, memberFilter) : [];
        return (
          <Card.Root key={c.id} borderColor="board.border" bgColor="board.panel">
            <Card.Body>
              <Stack gap="3.5">
                <Stack gap="1">
                  <HStack gap="2" justifyContent="space-between" alignItems="flex-start">
                    <Text fontWeight="bold" lineHeight="1.3">
                      {c.title}
                    </Text>
                    <Badge
                      size="sm"
                      variant="subtle"
                      colorPalette={c.kind === 'flat' ? 'gray' : 'pink'}
                    >
                      {c.kind === 'flat' ? '集合' : `${c.memberIds.length}人`}
                    </Badge>
                  </HStack>
                  <StatPills stats={s} />
                </Stack>

                <Stack gap="1.5">
                  <ProgressBar percent={s.percent} />
                  <HStack justifyContent="space-between">
                    <Text color="fg.muted" fontSize="2xs" fontVariantNumeric="tabular-nums">
                      {s.owned}/{s.total} 枚
                    </Text>
                    <Text color="fg.muted" fontSize="2xs" fontVariantNumeric="tabular-nums">
                      {s.percent}%
                    </Text>
                  </HStack>
                </Stack>

                {cells.length > 0 ? (
                  <Stack gap="2" pt="1">
                    <Text color="fg.subtle" fontSize="2xs" letterSpacing="0.08em">
                      メンバー別
                    </Text>
                    {cells.map((cell) => {
                      const pct =
                        cell.total === 0 ? 0 : Math.round((cell.owned / cell.total) * 100);
                      const complete = cell.owned === cell.total && cell.total > 0;
                      return (
                        <HStack key={cell.id} gap="2.5" alignItems="center">
                          <HStack gap="1.5" flexShrink="0" w="20" minW="0">
                            <Box
                              style={{ backgroundColor: cell.color }}
                              flexShrink="0"
                              borderRadius="full"
                              w="2.5"
                              h="2.5"
                            />
                            <Text fontSize="xs" truncate>
                              {cell.nickname}
                            </Text>
                          </HStack>
                          <Box
                            position="relative"
                            flex="1"
                            borderRadius="full"
                            h="1.5"
                            bgColor="bg.muted"
                            overflow="hidden"
                          >
                            <Box
                              style={{ width: `${pct}%`, backgroundColor: cell.color }}
                              position="absolute"
                              top="0"
                              left="0"
                              borderRadius="full"
                              h="full"
                              transition="width 0.4s ease"
                            />
                          </Box>
                          <Text
                            style={complete ? { color: cell.color } : undefined}
                            flexShrink="0"
                            w="8"
                            color={complete ? undefined : 'fg.muted'}
                            fontSize="2xs"
                            fontWeight={complete ? 'bold' : 'normal'}
                            fontVariantNumeric="tabular-nums"
                            textAlign="right"
                          >
                            {cell.owned}/{cell.total}
                          </Text>
                        </HStack>
                      );
                    })}
                  </Stack>
                ) : null}
              </Stack>
            </Card.Body>
          </Card.Root>
        );
      })}
    </Grid>
  );
}
