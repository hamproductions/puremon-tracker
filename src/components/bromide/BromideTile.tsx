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
const StepButton = styled('button');

function stackShadow(count: number, color: string, sm: boolean) {
  if (count >= 3) {
    return sm
      ? `2px 3px 0 0 ${color}cc, 4px 6px 0 0 ${color}88`
      : `4px 5px 0 0 ${color}cc, 8px 10px 0 0 ${color}80`;
  }
  if (count === 2) return sm ? `2px 3px 0 0 ${color}cc` : `4px 5px 0 0 ${color}cc`;
  if (count === 1) return `0 6px 18px -8px ${color}aa`;
  return undefined;
}

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
  const sm = size === 'sm';
  const interactive = Boolean(onToggle);
  const stepper = owned && showStepper && Boolean(onSetCount);

  const handleCardClick = () => {
    if (!owned) onToggle?.();
  };

  return (
    <Stack gap="1.5" w="full" minW="0">
      <Box
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && !owned ? 0 : undefined}
        aria-pressed={interactive ? owned : undefined}
        aria-label={label ? `${label}${owned ? `・所持${count}枚` : '・未所持'}` : undefined}
        onClick={interactive ? handleCardClick : undefined}
        onKeyDown={(e) => {
          if (!interactive || owned) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle?.();
          }
        }}
        style={{ borderColor: owned ? color : undefined, boxShadow: stackShadow(count, color, sm) }}
        cursor={interactive && !owned ? 'pointer' : 'default'}
        position="relative"
        aspectRatio="3 / 4"
        borderColor={owned ? undefined : 'board.border'}
        borderRadius={sm ? 'md' : 'lg'}
        borderWidth="2px"
        w="full"
        bgColor={owned ? 'board.owned' : 'board.missing'}
        opacity={owned ? 1 : 0.7}
        overflow="hidden"
        transition="transform 0.12s, box-shadow 0.18s, opacity 0.12s"
        borderStyle={owned ? 'solid' : 'dashed'}
        _hover={interactive && !owned ? { transform: 'translateY(-2px)', opacity: 1 } : undefined}
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
            filter={owned ? undefined : 'grayscale(0.8) brightness(0.85)'}
          />
        ) : (
          <Stack
            style={{
              background: `radial-gradient(120% 90% at 50% 0%, ${color}33 0%, ${color}14 45%, transparent 100%)`
            }}
            inset="0"
            position="absolute"
            gap="0"
            justifyContent="center"
            alignItems="center"
          >
            <Text textStyle="display" style={{ color }} fontSize={sm ? 'xl' : '3xl'} lineHeight="1">
              {bromide.no}
            </Text>
          </Stack>
        )}

        <Box
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 32%)'
          }}
          inset="0"
          position="absolute"
          pointerEvents="none"
        />

        {!bromide.imageUrl ? (
          <HStack
            position="absolute"
            left="0"
            right="0"
            bottom={stepper ? (sm ? '6' : '7') : '0'}
            gap="1"
            justifyContent="center"
            py="0.5"
            px="1"
            bgColor="rgba(0,0,0,0.32)"
            pointerEvents="none"
          >
            <Box
              style={{ backgroundColor: color }}
              flexShrink="0"
              borderRadius="full"
              w="1.5"
              h="1.5"
            />
            <Text color="white" fontSize="2xs" fontWeight="medium" truncate>
              {member ? member.nickname : '集合'}
            </Text>
          </HStack>
        ) : null}

        {owned ? (
          <HStack
            style={{ backgroundColor: isDup ? color : `${color}e6` }}
            position="absolute"
            top="1"
            right="1"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            minW="5"
            h="5"
            px="1"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            boxShadow="0 1px 4px rgba(0,0,0,0.4)"
          >
            {isDup ? `×${count}` : <FaCheck size={10} />}
          </HStack>
        ) : interactive ? (
          <HStack
            position="absolute"
            top="1"
            right="1"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            w="5"
            h="5"
            color="white"
            bgColor="rgba(0,0,0,0.35)"
          >
            <FaPlus size={10} />
          </HStack>
        ) : null}

        {stepper ? (
          <HStack
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            gap="0"
            justifyContent="space-between"
            alignItems="stretch"
            h={sm ? '6' : '7'}
            backdropFilter="blur(3px)"
          >
            <StepButton
              type="button"
              aria-label="減らす"
              onClick={(e) => {
                e.stopPropagation();
                onSetCount?.(Math.max(0, count - 1));
              }}
              cursor="pointer"
              display="flex"
              flex="1"
              justifyContent="center"
              alignItems="center"
              color="white"
              _hover={{ bgColor: 'rgba(255,255,255,0.16)' }}
            >
              <FaMinus size={sm ? 9 : 11} />
            </StepButton>
            <Text
              display="flex"
              justifyContent="center"
              alignItems="center"
              minW={sm ? '5' : '7'}
              color="white"
              fontSize={sm ? 'xs' : 'sm'}
              fontWeight="bold"
              fontVariantNumeric="tabular-nums"
            >
              {count}
            </Text>
            <StepButton
              type="button"
              aria-label="増やす"
              onClick={(e) => {
                e.stopPropagation();
                onSetCount?.(count + 1);
              }}
              cursor="pointer"
              display="flex"
              flex="1"
              justifyContent="center"
              alignItems="center"
              color="white"
              _hover={{ bgColor: 'rgba(255,255,255,0.16)' }}
            >
              <FaPlus size={sm ? 9 : 11} />
            </StepButton>
          </HStack>
        ) : null}
      </Box>

      {label ? (
        <Text maxW="full" color="fg.muted" fontSize="2xs" textAlign="center" truncate>
          {label}
        </Text>
      ) : null}
    </Stack>
  );
}
