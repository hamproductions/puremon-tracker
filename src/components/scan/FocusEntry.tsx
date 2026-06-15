import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheck, FaChevronLeft, FaChevronRight, FaForward, FaKeyboard } from 'react-icons/fa6';
import { Box, Center, HStack, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection } from '~/types';
import { bromidesByCollection, memberColor, memberLabel } from '~/utils/stats';

const Img = styled('img');

interface FocusEntryProps {
  catalog: Catalog;
  collection: Collection;
  countOf: (id: string) => number;
  onSet: (id: string, count: number) => void;
  onIncrement: (id: string) => void;
}

export function FocusEntry({ catalog, collection, countOf, onSet, onIncrement }: FocusEntryProps) {
  const bromides = useMemo(
    () =>
      bromidesByCollection(catalog, collection.id).sort(
        (a, b) => (a.memberId ?? '').localeCompare(b.memberId ?? '') || a.no - b.no
      ),
    [catalog, collection.id]
  );

  const [index, setIndex] = useState(0);
  const total = bromides.length;
  const clamped = Math.min(index, Math.max(0, total - 1));
  const current: Bromide | undefined = bromides[clamped];

  useEffect(() => {
    setIndex(0);
  }, [collection.id]);

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const back = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        onSet(current.id, Number(e.key));
        advance();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (e.key === ' ') {
        e.preventDefault();
        onIncrement(current.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, advance, back, onSet, onIncrement]);

  if (!current) {
    return (
      <Center py="16">
        <Text color="fg.muted" fontSize="sm">
          ブロマイドがありません
        </Text>
      </Center>
    );
  }

  const color = memberColor(catalog, current.memberId);
  const count = countOf(current.id);
  const name = memberLabel(catalog, current.memberId);

  const pick = (n: number) => {
    onSet(current.id, n);
    advance();
  };

  return (
    <Stack gap="4">
      <HStack justifyContent="space-between" alignItems="center">
        <Text color="fg.muted" fontSize="xs" fontWeight="bold" fontVariantNumeric="tabular-nums">
          {clamped + 1} / {total}
        </Text>
        <HStack display={{ base: 'none', md: 'flex' }} gap="1.5" color="fg.subtle" fontSize="2xs">
          <FaKeyboard />
          <Text fontSize="2xs">数字=枚数+次へ / ←→=移動 / Space=＋1</Text>
        </HStack>
      </HStack>

      <Box
        style={{
          borderColor: color,
          background: `linear-gradient(155deg, ${color}33 0%, ${color}10 65%, transparent 100%)`
        }}
        position="relative"
        aspectRatio="3 / 4"
        borderRadius="2xl"
        borderWidth="2px"
        w="full"
        maxW="xs"
        mx="auto"
        bgColor="board.tile"
        overflow="hidden"
      >
        {current.imageUrl ? (
          <Img
            src={current.imageUrl}
            alt=""
            inset="0"
            position="absolute"
            objectFit="cover"
            w="full"
            h="full"
          />
        ) : (
          <Center inset="0" position="absolute">
            <Text textStyle="display" style={{ color }} fontSize="6xl" lineHeight="1">
              {current.no}
            </Text>
          </Center>
        )}
        <HStack
          position="absolute"
          left="0"
          right="0"
          bottom="0"
          gap="2"
          justifyContent="space-between"
          alignItems="center"
          py="2"
          px="3"
          bgGradient="to-t"
          gradientFrom="black/55"
          gradientTo="transparent"
        >
          <Text
            style={{ textShadow: '0 1px 3px #0008' }}
            color="white"
            fontSize="sm"
            fontWeight="bold"
          >
            {name} No.{current.no}
          </Text>
          {count > 0 ? (
            <Box
              style={{ backgroundColor: color }}
              borderRadius="full"
              py="0.5"
              px="2"
              color="white"
              fontSize="xs"
              fontWeight="bold"
            >
              ×{count}
            </Box>
          ) : null}
        </HStack>
      </Box>

      <HStack gap="2" justifyContent="center" flexWrap="wrap">
        {[0, 1, 2, 3].map((n) => {
          const active = count === n;
          return (
            <Box
              as="button"
              key={n}
              onClick={() => pick(n)}
              style={{
                borderColor: active ? color : undefined,
                backgroundColor: active ? color : undefined,
                color: active ? '#fff' : undefined
              }}
              cursor="pointer"
              display="flex"
              justifyContent="center"
              alignItems="center"
              borderColor={active ? undefined : 'board.border'}
              borderRadius="xl"
              borderWidth="2px"
              w="14"
              h="14"
              color={active ? undefined : 'fg.default'}
              fontSize="2xl"
              fontWeight="bold"
              bgColor={active ? undefined : 'board.tile'}
              transition="all 0.1s"
              _active={{ transform: 'scale(0.92)' }}
            >
              {n}
            </Box>
          );
        })}
        <Box
          as="button"
          onClick={() => {
            onIncrement(current.id);
          }}
          aria-label="1枚追加"
          cursor="pointer"
          display="flex"
          justifyContent="center"
          alignItems="center"
          borderColor="board.border"
          borderRadius="xl"
          borderWidth="2px"
          w="14"
          h="14"
          color="accent.default"
          fontSize="2xl"
          fontWeight="bold"
          bgColor="board.tile"
          transition="all 0.1s"
          _active={{ transform: 'scale(0.92)' }}
        >
          ＋
        </Box>
      </HStack>

      <HStack gap="2" justifyContent="space-between">
        <styled.button
          onClick={back}
          disabled={clamped === 0}
          cursor="pointer"
          display="flex"
          gap="1.5"
          alignItems="center"
          borderColor="board.border"
          borderRadius="lg"
          borderWidth="1px"
          py="2.5"
          px="4"
          color="fg.muted"
          fontSize="sm"
          fontWeight="bold"
          bgColor="board.panel"
          _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
        >
          <FaChevronLeft size={12} />
          戻る
        </styled.button>
        <styled.button
          onClick={advance}
          disabled={clamped >= total - 1}
          cursor="pointer"
          display="flex"
          gap="1.5"
          alignItems="center"
          borderColor="board.border"
          borderRadius="lg"
          borderWidth="1px"
          py="2.5"
          px="4"
          color="fg.muted"
          fontSize="sm"
          fontWeight="bold"
          bgColor="board.panel"
          _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
        >
          {count > 0 ? (
            <>
              <FaCheck size={12} />
              次へ
            </>
          ) : (
            <>
              <FaForward size={12} />
              スキップ
            </>
          )}
          <FaChevronRight size={12} />
        </styled.button>
      </HStack>
    </Stack>
  );
}
