import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaImages, FaXmark } from 'react-icons/fa6';
import { Box, Center, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { blobToDataUrl, prepareImageBlob } from '~/lib/storage';
import type { Bromide, Catalog } from '~/types';
import { bromideLabel, memberColor } from '~/utils/stats';

const Img = styled('img');

interface Pairing {
  bromide: Bromide;
  file: File;
  preview: string | null;
}

interface BulkDropZoneProps {
  catalog: Catalog;
  queue: Bromide[];
  isAdmin: boolean;
  onCommit: (pairs: { bromide: Bromide; file: File }[]) => Promise<void>;
}

export function BulkDropZone({ catalog, queue, isAdmin, onCommit }: BulkDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pairs, setPairs] = useState<Pairing[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => setPairs([]);
  }, []);

  const accept = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    const targets = queue.slice(0, imgs.length);
    const next: Pairing[] = await Promise.all(
      targets.map(async (bromide, i) => {
        let preview: string | null = null;
        try {
          preview = await blobToDataUrl(await prepareImageBlob(imgs[i], 320));
        } catch {
          preview = null;
        }
        return { bromide, file: imgs[i], preview };
      })
    );
    setPairs(next);
  };

  const removeAt = (id: string) => setPairs((p) => p.filter((x) => x.bromide.id !== id));

  const commit = async () => {
    setBusy(true);
    try {
      await onCommit(pairs.map((p) => ({ bromide: p.bromide, file: p.file })));
      setPairs([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="3">
      <styled.input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          void accept(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
        display="none"
      />
      <Box
        as="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(false);
          void accept(Array.from(e.dataTransfer.files));
        }}
        cursor="pointer"
        borderColor={dragging ? 'accent.default' : 'board.border'}
        borderRadius="xl"
        borderWidth="2px"
        w="full"
        bgColor={dragging ? 'board.owned' : 'board.panel'}
        transition="all 0.12s"
        borderStyle="dashed"
        _hover={{ borderColor: 'accent.default' }}
      >
        <Stack gap="1.5" alignItems="center" py="8" color="fg.muted">
          <Box color="accent.default" fontSize="2xl">
            <FaImages />
          </Box>
          <Text color="fg.default" fontSize="sm" fontWeight="bold">
            まとめて画像を読み込む
          </Text>
          <Text fontSize="xs" textAlign="center">
            複数の画像をドロップ／選択すると、未登録のブロマイドへ順番に割り当てます
          </Text>
        </Stack>
      </Box>

      {pairs.length > 0 ? (
        <Stack gap="3">
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" fontWeight="bold">
              割り当てプレビュー（{pairs.length} 件）
            </Text>
            <Text color="fg.subtle" fontSize="2xs">
              {isAdmin ? '即時反映' : '承認後に公開'}
            </Text>
          </HStack>
          <Grid gap="2" columns={{ base: 2, sm: 3, md: 4 }}>
            {pairs.map((p) => {
              const color = memberColor(catalog, p.bromide.memberId);
              return (
                <Stack key={p.bromide.id} position="relative" gap="1">
                  <Box
                    style={{ borderColor: color }}
                    position="relative"
                    aspectRatio="3 / 4"
                    borderRadius="lg"
                    borderWidth="2px"
                    bgColor="board.tile"
                    overflow="hidden"
                  >
                    {p.preview ? (
                      <Img
                        src={p.preview}
                        alt=""
                        inset="0"
                        position="absolute"
                        objectFit="cover"
                        w="full"
                        h="full"
                      />
                    ) : (
                      <Center inset="0" position="absolute">
                        <Text textStyle="display" style={{ color }} fontSize="2xl">
                          {p.bromide.no}
                        </Text>
                      </Center>
                    )}
                    <Box
                      as="button"
                      onClick={() => removeAt(p.bromide.id)}
                      aria-label="除外"
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
                      bgColor="black/55"
                    >
                      <FaXmark size={11} />
                    </Box>
                  </Box>
                  <Text color="fg.muted" fontSize="2xs" textAlign="center" truncate>
                    {bromideLabel(catalog, p.bromide)}
                  </Text>
                </Stack>
              );
            })}
          </Grid>
          <Button onClick={commit} loading={busy} size="md">
            <FaCheck />
            {pairs.length} 件を{isAdmin ? '登録' : '投稿'}する
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
