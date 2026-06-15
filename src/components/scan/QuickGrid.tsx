import { useRef } from 'react';
import { Box, Grid, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection, Member } from '~/types';
import { buildGrid, memberMap } from '~/utils/stats';

const MAX = 3;

interface QuickGridProps {
  catalog: Catalog;
  collection: Collection;
  size?: string;
  countOf: (id: string) => number;
  onCycle: (id: string) => void;
  onReset: (id: string) => void;
}

export function QuickGrid({
  catalog,
  collection,
  size,
  countOf,
  onCycle,
  onReset
}: QuickGridProps) {
  const grid = buildGrid(catalog, collection, size);

  if (grid.kind === 'flat') {
    const mm = memberMap(catalog);
    return (
      <Grid gap="2.5" columns={{ base: 3, sm: 4, md: 6 }}>
        {grid.bromides.map((b) => (
          <QuickCell
            key={b.id}
            bromide={b}
            member={b.memberId ? (mm.get(b.memberId) ?? undefined) : undefined}
            showMemberLabel
            count={countOf(b.id)}
            onCycle={() => onCycle(b.id)}
            onReset={() => onReset(b.id)}
          />
        ))}
      </Grid>
    );
  }

  return (
    <Stack gap="3.5">
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
                <QuickCell
                  key={b.id}
                  bromide={b}
                  member={m}
                  count={countOf(b.id)}
                  onCycle={() => onCycle(b.id)}
                  onReset={() => onReset(b.id)}
                />
              );
            })}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}

interface QuickCellProps {
  bromide: Bromide;
  member?: Member;
  showMemberLabel?: boolean;
  count: number;
  onCycle: () => void;
  onReset: () => void;
}

function QuickCell({ bromide, member, showMemberLabel, count, onCycle, onReset }: QuickCellProps) {
  const color = member?.color ?? '#FF5FA2';
  const owned = count > 0;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const startPress = () => {
    longPressed.current = false;
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onReset();
    }, 500);
  };
  const endPress = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <Stack gap="1" minW="0">
      <Box
        as="button"
        onClick={() => {
          if (longPressed.current) {
            longPressed.current = false;
            return;
          }
          onCycle();
        }}
        onContextMenu={(e: React.MouseEvent) => {
          e.preventDefault();
          onReset();
        }}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        aria-label={`No.${bromide.no} ${count}枚`}
        style={{
          borderColor: owned ? color : undefined,
          background: owned
            ? `linear-gradient(150deg, ${color}3a 0%, ${color}14 70%, transparent 100%)`
            : undefined
        }}
        cursor="pointer"
        position="relative"
        aspectRatio="3 / 4"
        borderColor={owned ? undefined : 'board.border'}
        borderRadius="lg"
        borderWidth="2px"
        w="full"
        bgColor={owned ? 'board.owned' : 'board.tile'}
        boxShadow={owned ? 'sm' : undefined}
        overflow="hidden"
        userSelect="none"
        transition="transform 0.1s, box-shadow 0.12s, border-color 0.12s, background 0.12s"
        _active={{ transform: 'scale(0.93)' }}
        _hover={{ transform: 'translateY(-1px)' }}
      >
        <Stack inset="0" position="absolute" gap="0" justifyContent="center" alignItems="center">
          <Text
            textStyle="display"
            style={{ color: owned ? color : undefined }}
            color={owned ? undefined : 'fg.subtle'}
            fontSize="lg"
            lineHeight="1"
          >
            {bromide.no}
          </Text>
        </Stack>

        {owned ? (
          <Box
            style={{ backgroundColor: color }}
            position="absolute"
            top="0.5"
            right="0.5"
            borderRadius="full"
            minW="5"
            py="0.5"
            px="1"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            lineHeight="1.2"
            textAlign="center"
          >
            ×{count}
          </Box>
        ) : null}
      </Box>
      <Text color="fg.muted" fontSize="2xs" textAlign="center" truncate>
        {showMemberLabel && member ? `${member.nickname} No.${bromide.no}` : `No.${bromide.no}`}
      </Text>
    </Stack>
  );
}

export { MAX as QUICK_MAX };
