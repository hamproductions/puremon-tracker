import { FaCamera, FaCheck, FaMinus, FaPlus, FaTrash, FaXmark } from 'react-icons/fa6';
import { Box, Center, HStack, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Bromide, Member } from '~/types';
import { readableText } from '~/utils/color';
import { slotLabel } from '~/utils/stats';

interface BromideTileProps {
  bromide: Bromide;
  member?: Member | null;
  count: number;
  onToggle?: () => void;
  onSetCount?: (n: number) => void;
  label?: string;
  showStepper?: boolean;
  size?: 'sm' | 'md';
  adminEdit?: boolean;
  onAddImage?: () => void;
  onRemoveImage?: () => void;
  onEditMember?: () => void;
  onRemoveCard?: () => void;
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
  size = 'md',
  adminEdit = false,
  onAddImage,
  onRemoveImage,
  onEditMember,
  onRemoveCard
}: BromideTileProps) {
  const owned = count >= 1;
  const isDup = count >= 2;
  const color = member?.color ?? '#2196f3';
  const ink = readableText(color);
  const who = member ? member.name : bromide.memberId ? '' : '集合';
  const name = `${who ? `${who} ` : ''}${bromide.size ? `${bromide.size} ` : ''}${slotLabel(bromide)}`;
  const sm = size === 'sm';
  const interactive = Boolean(onToggle);
  const editClickable = adminEdit && Boolean(onEditMember);
  const ownClickable = !adminEdit && interactive && !owned;
  const clickable = editClickable || ownClickable;
  const handleClick = editClickable ? onEditMember : ownClickable ? onToggle : undefined;
  const stepper = !adminEdit && owned && showStepper && Boolean(onSetCount);
  const hasImg = Boolean(bromide.imageUrl);

  return (
    <Stack gap="1" w="full" minW="0">
      <Box
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={
          editClickable
            ? `${name}・メンバーを変更`
            : `${name}${owned ? `・所持${count}枚` : '・未所持'}`
        }
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!clickable) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick?.();
          }
        }}
        style={{
          backgroundColor: owned && !hasImg ? color : undefined,
          borderColor: owned || editClickable ? color : undefined
        }}
        cursor={clickable ? 'pointer' : 'default'}
        position="relative"
        aspectRatio="3 / 4"
        borderColor={owned ? undefined : 'board.border'}
        borderRadius={sm ? 'md' : 'lg'}
        borderWidth={editClickable ? '2px' : '1px'}
        w="full"
        bgColor={owned ? undefined : 'board.missing'}
        overflow="hidden"
        transition="background-color 0.12s, border-color 0.12s"
        _hover={clickable ? { borderColor: 'accent.default', bgColor: 'bg.muted' } : undefined}
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

        {(!hasImg || adminEdit) && onAddImage ? (
          <styled.button
            type="button"
            aria-label={`${name}の画像を${hasImg ? '差し替え' : '追加'}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddImage();
            }}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            cursor="pointer"
            display="flex"
            zIndex="2"
            position="absolute"
            left="1"
            bottom={stepper ? (sm ? '5' : '7') : '1'}
            gap="1"
            justifyContent="center"
            alignItems="center"
            borderRadius="md"
            minW={sm ? '12' : '10'}
            h={sm ? '8' : '9'}
            px="2"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            bgColor="rgba(0,0,0,0.45)"
            opacity={0.85}
            _hover={{ bgColor: 'rgba(0,0,0,0.75)', opacity: 1 }}
          >
            <FaCamera size={9} />
            {hasImg ? '差替' : '画像'}
          </styled.button>
        ) : null}

        {adminEdit && hasImg && onRemoveImage ? (
          <styled.button
            type="button"
            aria-label="画像を削除"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveImage();
            }}
            cursor="pointer"
            display="flex"
            position="absolute"
            right="1"
            bottom="1"
            justifyContent="center"
            alignItems="center"
            borderRadius="md"
            w="6"
            h="6"
            color="white"
            bgColor="red.9"
            opacity={0.9}
            _hover={{ bgColor: 'red.10', opacity: 1 }}
          >
            <FaTrash size={10} />
          </styled.button>
        ) : null}

        {adminEdit && onRemoveCard ? (
          <styled.button
            type="button"
            aria-label="カードを削除"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCard();
            }}
            cursor="pointer"
            display="flex"
            position="absolute"
            top="1"
            right="1"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            w="5"
            h="5"
            color="white"
            bgColor="red.9"
            _hover={{ bgColor: 'red.10' }}
          >
            <FaXmark size={11} />
          </styled.button>
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
