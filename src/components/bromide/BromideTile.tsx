import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa6';
import { Box, HStack, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Bromide, Member } from '~/types';

interface BromideTileProps {
  bromide: Bromide;
  member?: Member | null;
  count: number;
  onToggle?: () => void;
  onSetCount?: (n: number) => void;
  label?: string;
  showStepper?: boolean;
  size?: 'sm' | 'md';
}

const Img = styled('img');

export function BromideTile({
  bromide,
  member,
  count,
  onToggle,
  onSetCount,
  label,
  showStepper = true,
  size = 'md'
}: BromideTileProps) {
  const owned = count >= 1;
  const isDup = count >= 2;
  const color = member?.color ?? '#FF5FA2';
  const interactive = Boolean(onToggle);

  return (
    <Stack gap="1.5" w="full" minW="0">
      <Box
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive ? owned : undefined}
        aria-label={label ? `${label}${owned ? '・所持' : '・未所持'}` : undefined}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle?.();
          }
        }}
        style={{ borderColor: owned ? color : undefined }}
        cursor={interactive ? 'pointer' : 'default'}
        position="relative"
        aspectRatio="3 / 4"
        borderColor={owned ? undefined : 'board.border'}
        borderRadius="lg"
        borderWidth="2px"
        w="full"
        bgColor={owned ? 'board.owned' : 'board.missing'}
        opacity={owned ? 1 : 0.65}
        overflow="hidden"
        transition="transform 0.12s, opacity 0.12s, border-color 0.12s"
        borderStyle={owned ? 'solid' : 'dashed'}
        _hover={interactive ? { transform: 'translateY(-2px)', opacity: 1 } : undefined}
        animation={owned ? 'pop 0.18s ease' : undefined}
      >
        {bromide.imageUrl ? (
          <Img
            src={bromide.imageUrl}
            alt={label ?? ''}
            loading="lazy"
            inset="0"
            position="absolute"
            objectFit="cover"
            w="full"
            h="full"
            filter={owned ? undefined : 'grayscale(0.7)'}
          />
        ) : (
          <Stack
            style={{
              background: `linear-gradient(150deg, ${color}26 0%, ${color}0d 60%, transparent 100%)`
            }}
            inset="0"
            position="absolute"
            gap="0"
            justifyContent="center"
            alignItems="center"
          >
            <Text
              textStyle="display"
              style={{ color }}
              fontSize={size === 'sm' ? 'lg' : '2xl'}
              lineHeight="1"
            >
              {bromide.no}
            </Text>
            {member ? (
              <Text maxW="90%" mt="0.5" color="fg.muted" fontSize="2xs" truncate>
                {member.nickname}
              </Text>
            ) : (
              <Text mt="0.5" color="fg.muted" fontSize="2xs">
                No.
              </Text>
            )}
          </Stack>
        )}

        {owned ? (
          <HStack
            style={{ backgroundColor: color }}
            position="absolute"
            top="1"
            right="1"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            w="5"
            h="5"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            boxShadow="sm"
          >
            {isDup ? `×${count}` : <FaCheck size={10} />}
          </HStack>
        ) : null}
      </Box>

      {showStepper && owned && onSetCount ? (
        <HStack gap="0" justifyContent="center" alignItems="center">
          <Box
            as="button"
            aria-label="減らす"
            onClick={() => onSetCount(Math.max(0, count - 1))}
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderRadius="md"
            w="6"
            h="6"
            color="fg.muted"
            _hover={{ bgColor: 'bg.muted' }}
          >
            <FaMinus size={10} />
          </Box>
          <Text
            minW="6"
            fontSize="sm"
            fontWeight="bold"
            fontVariantNumeric="tabular-nums"
            textAlign="center"
          >
            {count}
          </Text>
          <Box
            as="button"
            aria-label="増やす"
            onClick={() => onSetCount(count + 1)}
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderRadius="md"
            w="6"
            h="6"
            color="fg.muted"
            _hover={{ bgColor: 'bg.muted' }}
          >
            <FaPlus size={10} />
          </Box>
        </HStack>
      ) : null}

      {label ? (
        <Text maxW="full" color="fg.muted" fontSize="2xs" textAlign="center" truncate>
          {label}
        </Text>
      ) : null}
    </Stack>
  );
}
