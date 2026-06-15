import { Box, Grid, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection, Member } from '~/types';
import { buildGrid } from '~/utils/stats';

const Img = styled('img');

interface TargetGridProps {
  catalog: Catalog;
  collection: Collection;
  size?: string;
  selectedId: string | null;
  onSelect: (bromide: Bromide) => void;
}

export function TargetGrid({ catalog, collection, size, selectedId, onSelect }: TargetGridProps) {
  const grid = buildGrid(catalog, collection, size);

  if (grid.kind === 'flat') {
    return (
      <Grid gap="2.5" columns={{ base: 3, sm: 4, md: 6 }}>
        {grid.bromides.map((b) => (
          <TargetCell
            key={b.id}
            bromide={b}
            selected={b.id === selectedId}
            onSelect={() => onSelect(b)}
          />
        ))}
      </Grid>
    );
  }

  return (
    <Stack gap="3">
      {grid.members.map((m) => (
        <Stack key={m.id} gap="1.5">
          <Box display="flex" gap="2" alignItems="center">
            <Box style={{ backgroundColor: m.color }} borderRadius="full" w="2.5" h="2.5" />
            <Text color="fg.muted" fontSize="xs" fontWeight="bold">
              {m.name}
            </Text>
          </Box>
          <Grid gap="2" columns={{ base: 4, sm: 6, md: 8 }}>
            {grid.numbers.map((no) => {
              const b = grid.cell(m.id, no);
              if (!b) return null;
              return (
                <TargetCell
                  key={b.id}
                  bromide={b}
                  member={m}
                  selected={b.id === selectedId}
                  onSelect={() => onSelect(b)}
                />
              );
            })}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}

interface TargetCellProps {
  bromide: Bromide;
  member?: Member;
  selected: boolean;
  onSelect: () => void;
}

function TargetCell({ bromide, member, selected, onSelect }: TargetCellProps) {
  const wanted = !bromide.imageUrl;
  const color = member?.color ?? '#FF5FA2';

  return (
    <Stack gap="1" minW="0">
      <Box
        as="button"
        onClick={onSelect}
        aria-pressed={selected}
        style={{ borderColor: selected ? color : undefined }}
        cursor="pointer"
        position="relative"
        aspectRatio="3 / 4"
        borderColor={selected ? undefined : wanted ? 'accent.default' : 'board.border'}
        borderRadius="lg"
        borderWidth="2px"
        w="full"
        bgColor={wanted ? 'board.missing' : 'board.tile'}
        boxShadow={selected ? 'md' : undefined}
        overflow="hidden"
        transition="transform 0.12s, box-shadow 0.12s, border-color 0.12s"
        borderStyle={wanted ? 'dashed' : 'solid'}
        _hover={{ transform: 'translateY(-2px)' }}
      >
        {bromide.imageUrl ? (
          <Img
            src={bromide.imageUrl}
            alt=""
            loading="lazy"
            inset="0"
            position="absolute"
            objectFit="cover"
            w="full"
            h="full"
            opacity={selected ? 1 : 0.85}
          />
        ) : (
          <Stack
            style={{
              background: `linear-gradient(150deg, ${color}24 0%, ${color}0d 60%, transparent 100%)`
            }}
            inset="0"
            position="absolute"
            gap="0.5"
            justifyContent="center"
            alignItems="center"
          >
            <Text textStyle="display" style={{ color }} fontSize="xl" lineHeight="1">
              {bromide.no}
            </Text>
          </Stack>
        )}

        {wanted ? (
          <Box
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            py="0.5"
            color="accent.fg"
            fontSize="2xs"
            fontWeight="bold"
            textAlign="center"
            bgColor="accent.default"
          >
            画像募集中
          </Box>
        ) : null}
      </Box>
      <Text color="fg.muted" fontSize="2xs" textAlign="center" truncate>
        No.{bromide.no}
      </Text>
    </Stack>
  );
}
