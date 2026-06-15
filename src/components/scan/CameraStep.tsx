import { useEffect, useRef, useState } from 'react';
import {
  FaArrowsRotate,
  FaCamera,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaForward
} from 'react-icons/fa6';
import { Box, Center, HStack, Stack, styled } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { blobToDataUrl, prepareImageBlob } from '~/lib/storage';
import type { Bromide, Catalog } from '~/types';
import { memberColor, memberLabel } from '~/utils/stats';

const Img = styled('img');

interface CameraStepProps {
  catalog: Catalog;
  bromide: Bromide;
  position: number;
  total: number;
  isAdmin: boolean;
  onConfirm: (file: File) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
  canBack: boolean;
  canForward: boolean;
}

export function CameraStep({
  catalog,
  bromide,
  position,
  total,
  isAdmin,
  onConfirm,
  onBack,
  onSkip,
  canBack,
  canForward
}: CameraStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const color = memberColor(catalog, bromide.memberId);
  const name = memberLabel(catalog, bromide.memberId);

  useEffect(() => {
    setFile(null);
    setPreview(null);
  }, [bromide.id]);

  const pick = async (f: File) => {
    setFile(f);
    try {
      setPreview(await blobToDataUrl(await prepareImageBlob(f, 700)));
    } catch {
      setPreview(null);
    }
  };

  const confirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await onConfirm(file);
      setFile(null);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setFile(null);
    setPreview(null);
    inputRef.current?.click();
  };

  return (
    <Stack gap="4">
      <styled.input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = '';
        }}
        display="none"
      />

      <HStack justifyContent="space-between" alignItems="center">
        <Text color="fg.muted" fontSize="xs" fontWeight="bold" fontVariantNumeric="tabular-nums">
          {position} / {total}
        </Text>
        <Box
          style={{ backgroundColor: `${color}22`, color }}
          borderRadius="full"
          py="1"
          px="2.5"
          fontSize="2xs"
          fontWeight="bold"
        >
          {name} No.{bromide.no}
        </Box>
      </HStack>

      <Box
        style={{
          borderColor: color,
          background: `linear-gradient(155deg, ${color}2e 0%, ${color}0f 65%, transparent 100%)`
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
        {preview ? (
          <Img
            src={preview}
            alt="プレビュー"
            inset="0"
            position="absolute"
            objectFit="cover"
            w="full"
            h="full"
          />
        ) : bromide.imageUrl ? (
          <>
            <Img
              src={bromide.imageUrl}
              alt=""
              inset="0"
              position="absolute"
              objectFit="cover"
              w="full"
              h="full"
              opacity={0.5}
            />
            <Center inset="0" position="absolute">
              <Box
                borderRadius="md"
                py="1"
                px="2"
                color="white"
                fontSize="2xs"
                fontWeight="bold"
                bgColor="black/55"
              >
                登録済み・上書き可
              </Box>
            </Center>
          </>
        ) : (
          <Center inset="0" position="absolute">
            <Stack gap="2" alignItems="center" color="fg.subtle">
              <Box style={{ color }} fontSize="3xl">
                <FaCamera />
              </Box>
              <Text textStyle="display" style={{ color }} fontSize="5xl" lineHeight="1">
                {bromide.no}
              </Text>
            </Stack>
          </Center>
        )}
      </Box>

      {preview ? (
        <HStack gap="2">
          <Button onClick={retake} variant="outline" size="lg" flex="1">
            <FaArrowsRotate />
            撮り直し
          </Button>
          <Button onClick={confirm} loading={busy} size="lg" flex="1">
            <FaCheck />
            使う
          </Button>
        </HStack>
      ) : (
        <Button onClick={() => inputRef.current?.click()} size="lg">
          <FaCamera />
          撮影／画像を選ぶ
        </Button>
      )}

      <HStack gap="2" justifyContent="space-between">
        <styled.button
          onClick={onBack}
          disabled={!canBack}
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
          onClick={onSkip}
          disabled={!canForward}
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
          <FaForward size={12} />
          スキップ
          <FaChevronRight size={12} />
        </styled.button>
      </HStack>

      <Text color="fg.subtle" fontSize="2xs" textAlign="center">
        {isAdmin ? '撮影すると即時反映されます' : '撮影すると承認後に公開されます'}
      </Text>
    </Stack>
  );
}
