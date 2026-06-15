import { useMemo } from 'react';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection, OwnershipMap } from '~/types';
import { duplicateBromides, memberColor, missingBromides } from '~/utils/stats';
import { SelectableChip } from './chips';

type Side = 'give' | 'want';

interface CollectionGroup {
  collection: Collection;
  items: { bromide: Bromide; count: number }[];
}

function buildGroups(
  catalog: Catalog,
  ownership: OwnershipMap,
  collections: Collection[],
  side: Side
): CollectionGroup[] {
  return collections
    .map((c) => ({
      collection: c,
      items:
        side === 'give'
          ? duplicateBromides(catalog, ownership, c.id).map((e) => ({
              bromide: e.bromide,
              count: e.count
            }))
          : missingBromides(catalog, ownership, c.id).map((b) => ({ bromide: b, count: 0 }))
    }))
    .filter((g) => g.items.length > 0);
}

interface SideSectionProps {
  catalog: Catalog;
  ownership: OwnershipMap;
  collections: Collection[];
  side: Side;
  title: string;
  hint: string;
  colorPalette: 'pink' | 'gray';
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSetMany: (ids: string[], on: boolean) => void;
}

function SideSection({
  catalog,
  ownership,
  collections,
  side,
  title,
  hint,
  colorPalette,
  selected,
  onToggle,
  onSetMany
}: SideSectionProps) {
  const groups = useMemo(
    () => buildGroups(catalog, ownership, collections, side),
    [catalog, ownership, collections, side]
  );

  const allIds = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.bromide.id)), [groups]);
  const selectedCount = allIds.filter((id) => selected.has(id)).length;
  const allOn = allIds.length > 0 && selectedCount === allIds.length;

  return (
    <Stack gap="3">
      <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <HStack gap="2" alignItems="baseline">
          <Text fontSize="sm" fontWeight="bold">
            {title}
          </Text>
          <Badge size="sm" variant="subtle" colorPalette={colorPalette}>
            {selectedCount}
          </Badge>
        </HStack>
        {allIds.length > 0 ? (
          <Box
            as="button"
            onClick={() => onSetMany(allIds, !allOn)}
            color="accent.text"
            fontSize="xs"
            fontWeight="medium"
            _hover={{ textDecoration: 'underline' }}
          >
            {allOn ? '全解除' : '全選択'}
          </Box>
        ) : null}
      </HStack>

      <Text color="fg.muted" fontSize="2xs">
        {hint}
      </Text>

      {groups.length === 0 ? (
        <Box
          borderColor="board.border"
          borderRadius="lg"
          borderWidth="1px"
          py="4"
          px="3"
          textAlign="center"
          borderStyle="dashed"
        >
          <Text color="fg.muted" fontSize="xs">
            {side === 'give' ? '出せるダブりがありません' : '不足はありません'}
          </Text>
        </Box>
      ) : (
        <Stack gap="4">
          {groups.map(({ collection, items }) => {
            const groupIds = items.map((i) => i.bromide.id);
            const groupOn = groupIds.every((id) => selected.has(id));
            return (
              <Stack key={collection.id} gap="2">
                <HStack gap="2" justifyContent="space-between" alignItems="center">
                  <Text color="fg.muted" fontSize="2xs" fontWeight="bold" truncate>
                    {collection.title}
                  </Text>
                  <Box
                    as="button"
                    onClick={() => onSetMany(groupIds, !groupOn)}
                    flexShrink="0"
                    color="fg.subtle"
                    fontSize="2xs"
                    _hover={{ color: 'accent.text' }}
                  >
                    {groupOn ? '解除' : '選択'}
                  </Box>
                </HStack>
                <Grid gap="1.5" columns={{ base: 2, sm: 3 }}>
                  {items.map(({ bromide, count }) => (
                    <SelectableChip
                      key={bromide.id}
                      label={memberShort(catalog, bromide)}
                      sub={
                        side === 'give' ? `No.${bromide.no} ・ ×${count - 1}` : `No.${bromide.no}`
                      }
                      selected={selected.has(bromide.id)}
                      onClick={() => onToggle(bromide.id)}
                      color={memberColor(catalog, bromide.memberId)}
                    />
                  ))}
                </Grid>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

function memberShort(catalog: Catalog, b: Bromide): string {
  if (!b.memberId) return '集合';
  return catalog.members.find((m) => m.id === b.memberId)?.name ?? `No.${b.no}`;
}

interface SelectionPanelProps {
  catalog: Catalog;
  ownership: OwnershipMap;
  collections: Collection[];
  gives: Set<string>;
  wants: Set<string>;
  onToggleGive: (id: string) => void;
  onToggleWant: (id: string) => void;
  onSetGives: (ids: string[], on: boolean) => void;
  onSetWants: (ids: string[], on: boolean) => void;
}

export function SelectionPanel({
  catalog,
  ownership,
  collections,
  gives,
  wants,
  onToggleGive,
  onToggleWant,
  onSetGives,
  onSetWants
}: SelectionPanelProps) {
  return (
    <Grid gap="6" columns={{ base: 1, md: 2 }}>
      <SideSection
        catalog={catalog}
        ownership={ownership}
        collections={collections}
        side="give"
        title="譲（ゆずります）"
        hint="ダブっているブロマイドです。出したい分だけ選択。×は出せる枚数。"
        selected={gives}
        onToggle={onToggleGive}
        onSetMany={onSetGives}
        colorPalette="pink"
      />
      <SideSection
        catalog={catalog}
        ownership={ownership}
        collections={collections}
        side="want"
        title="求（もとめます）"
        hint="未所持のブロマイドです。集めたいものだけ選択してください。"
        selected={wants}
        onToggle={onToggleWant}
        onSetMany={onSetWants}
        colorPalette="gray"
      />
    </Grid>
  );
}
