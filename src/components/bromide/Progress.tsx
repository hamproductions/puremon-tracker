import { Box, HStack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import type { OwnStats } from '~/utils/stats';

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <Box
      position="relative"
      borderRadius="full"
      w="full"
      h="2"
      bgColor="bg.muted"
      overflow="hidden"
    >
      <Box
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        position="absolute"
        top="0"
        left="0"
        borderRadius="full"
        h="full"
        bgColor="accent.default"
        transition="width 0.4s ease"
      />
    </Box>
  );
}

export function StatPills({ stats, mounted = true }: { stats: OwnStats; mounted?: boolean }) {
  return (
    <HStack gap="1.5" flexWrap="wrap">
      <Badge size="sm" variant={mounted && stats.owned > 0 ? 'solid' : 'outline'}>
        {mounted ? `${stats.owned}/${stats.total}・${stats.percent}%` : `全${stats.total}`}
      </Badge>
      {mounted && stats.missing > 0 ? (
        <Badge size="sm" variant="subtle" colorPalette="gray">
          不足 {stats.missing}
        </Badge>
      ) : null}
      {mounted && stats.duplicates > 0 ? (
        <Badge size="sm" variant="subtle" colorPalette="amber">
          ダブり {stats.duplicates}
        </Badge>
      ) : null}
    </HStack>
  );
}
