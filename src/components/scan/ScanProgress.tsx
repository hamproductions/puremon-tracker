import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';

interface ScanProgressProps {
  label: string;
  current: number;
  total: number;
  note?: string;
  accent?: string;
}

export function ScanProgress({ label, current, total, note, accent }: ScanProgressProps) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <Box
      zIndex="20"
      position="sticky"
      top="0"
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      py="3"
      px="4"
      bgColor="board.panel"
      boxShadow="sm"
      backdropFilter="blur(10px)"
    >
      <Stack gap="2">
        <HStack justifyContent="space-between" alignItems="baseline">
          <Text color="fg.muted" fontSize="xs" fontWeight="bold">
            {label}
          </Text>
          <HStack gap="1.5" alignItems="baseline">
            {note ? (
              <Text color="fg.subtle" fontSize="2xs" fontVariantNumeric="tabular-nums">
                {note}
              </Text>
            ) : null}
            <HStack gap="1" alignItems="baseline">
              <Text
                textStyle="display"
                style={accent ? { color: accent } : undefined}
                color={accent ? undefined : 'accent.default'}
                fontSize="xl"
                fontVariantNumeric="tabular-nums"
                lineHeight="1"
              >
                {current}
              </Text>
              <Text color="fg.muted" fontSize="sm" fontVariantNumeric="tabular-nums">
                / {total}
              </Text>
            </HStack>
          </HStack>
        </HStack>
        <Box
          position="relative"
          borderRadius="full"
          h="2"
          bgColor="board.missing"
          overflow="hidden"
        >
          <Box
            style={{
              width: `${percent}%`,
              backgroundColor: accent ?? undefined
            }}
            inset="0"
            position="absolute"
            borderRadius="full"
            bgColor={accent ? undefined : 'accent.default'}
            transition="width 0.2s ease"
          />
        </Box>
      </Stack>
    </Box>
  );
}
