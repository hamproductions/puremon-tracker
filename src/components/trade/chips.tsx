import { Box } from 'styled-system/jsx';

export function CollectionPill({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      borderColor={active ? 'accent.default' : 'board.border'}
      borderRadius="full"
      borderWidth="1px"
      py="1.5"
      px="3.5"
      color={active ? 'accent.fg' : 'fg.muted'}
      fontSize="xs"
      fontWeight={active ? 'bold' : 'medium'}
      bgColor={active ? 'accent.default' : 'board.panel'}
      transition="all 0.12s"
      whiteSpace="nowrap"
      _hover={{ borderColor: 'accent.default' }}
    >
      {label}
    </Box>
  );
}

export function SelectableChip({
  label,
  sub,
  color,
  selected,
  onClick
}: {
  label: string;
  sub?: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      gap="2"
      alignItems="center"
      borderColor={selected ? 'accent.emphasized' : 'board.border'}
      borderRadius="lg"
      borderWidth="1px"
      minW="0"
      py="2"
      px="2.5"
      textAlign="left"
      bgColor={selected ? 'accent.subtle' : 'board.tile'}
      opacity={selected ? 1 : 0.62}
      transition="all 0.12s"
      _hover={{ opacity: 1, borderColor: 'accent.emphasized' }}
    >
      <Box style={{ backgroundColor: color }} flexShrink="0" borderRadius="full" w="2" minH="7" />
      <Box flex="1" minW="0">
        <Box fontSize="sm" fontWeight="medium" lineHeight="1.2" truncate>
          {label}
        </Box>
        {sub ? (
          <Box color="fg.muted" fontSize="2xs" fontVariantNumeric="tabular-nums">
            {sub}
          </Box>
        ) : null}
      </Box>
      <Box
        as="span"
        display="flex"
        flexShrink="0"
        justifyContent="center"
        alignItems="center"
        borderColor={selected ? 'accent.default' : 'border.default'}
        borderRadius="sm"
        borderWidth="1.5px"
        w="4"
        h="4"
        color="accent.fg"
        fontSize="2xs"
        lineHeight="1"
        bgColor={selected ? 'accent.default' : 'transparent'}
      >
        {selected ? '✓' : ''}
      </Box>
    </Box>
  );
}
