import { FaCheck, FaMinus, FaPlus } from 'react-icons/fa6';
import { Box, Center, HStack, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Bromide, Member } from '~/types';
import { readableText } from '~/utils/color';

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
  const color = member?.color ?? '#2196f3';
  const ink = readableText(color);
  const who = member ? member.name : bromide.memberId ? '' : '集合';
  const name = `${who ? `${who} ` : ''}${bromide.size ? `${bromide.size} ` : ''}No.${bromide.no}`;
  const sm = size === 'sm';
  const interactive = Boolean(onToggle);
  const stepper = owned && showStepper && Boolean(onSetCount);
  const hasImg = Boolean(bromide.imageUrl);

  return (
    <Stack gap="1" w="full" minW="0">
      <Box
        role={interactive && !owned ? 'button' : undefined}
        tabIndex={interactive && !owned ? 0 : undefined}
        aria-label={`${name}${owned ? `・所持${count}枚` : '・未所持'}`}
        onClick={interactive && !owned ? onToggle : undefined}
        onKeyDown={(e) => {
          if (!interactive || owned) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle?.();
          }
        }}
        style={{
          backgroundColor: owned && !hasImg ? color : undefined,
          borderColor: owned ? color : undefined
        }}
        cursor={interactive && !owned ? 'pointer' : 'default'}
        position="relative"
        aspectRatio="3 / 4"
        borderColor={owned ? undefined : 'board.border'}
        borderRadius={sm ? 'md' : 'lg'}
        borderWidth="1px"
        w="full"
        bgColor={owned ? undefined : 'board.missing'}
        overflow="hidden"
        transition="background-color 0.12s, border-color 0.12s"
        _hover={
          interactive && !owned ? { borderColor: 'accent.default', bgColor: 'bg.muted' } : undefined
        }
      >
        {hasImg ? (
          <Img
            src={bromide.imageUrl}
            alt={label ?? ''}
            loading="lazy"
            inset="0"
            position="absolute"
            objectFit="cover"
            w="full"
            h="full"
            filter={owned ? undefined : 'grayscale(1) opacity(0.45)'}
          />
        ) : null}

        {owned && !hasImg ? (
          <Center
            style={{ color: ink, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}
            inset="0"
            position="absolute"
            pb={stepper ? (sm ? '5' : '7') : '0'}
          >
            {isDup ? (
              <Text textStyle="display" fontSize={sm ? 'lg' : '2xl'} lineHeight="1">
                ×{count}
              </Text>
            ) : (
              <FaCheck size={sm ? 16 : 22} />
            )}
          </Center>
        ) : null}

        {owned && hasImg ? (
          <Center
            style={{ backgroundColor: color, color: ink }}
            position="absolute"
            top="1"
            right="1"
            borderRadius="full"
            minW="5"
            h="5"
            px="1"
            fontSize="2xs"
            fontWeight="bold"
          >
            {isDup ? `×${count}` : <FaCheck size={10} />}
          </Center>
        ) : null}

        {stepper ? (
          <HStack
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            gap="0"
            justifyContent="space-between"
            alignItems="stretch"
            h={sm ? '5' : '7'}
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
              _hover={{ bgColor: 'rgba(255,255,255,0.2)' }}
            >
              <FaMinus size={sm ? 8 : 10} />
            </StepButton>
            <Text
              display="flex"
              justifyContent="center"
              alignItems="center"
              minW={sm ? '4' : '6'}
              color="white"
              fontSize={sm ? '2xs' : 'xs'}
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
              _hover={{ bgColor: 'rgba(255,255,255,0.2)' }}
            >
              <FaPlus size={sm ? 8 : 10} />
            </StepButton>
          </HStack>
        ) : null}
      </Box>

      {label ? (
        <Text maxW="full" color="fg.muted" fontSize="xs" textAlign="center" truncate>
          {label}
        </Text>
      ) : null}
    </Stack>
  );
}
