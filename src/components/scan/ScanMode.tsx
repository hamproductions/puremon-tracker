import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaBolt, FaCircleCheck } from 'react-icons/fa6';
import { Box, Center, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import type { Bromide, Catalog, Collection } from '~/types';
import { bromidesByCollection } from '~/utils/stats';
import { BulkDropZone } from './BulkDropZone';
import { CameraStep } from './CameraStep';
import { useImageRegister } from './useImageRegister';

interface ScanModeProps {
  catalog: Catalog;
  collection: Collection;
  size?: string;
}

export function ScanMode({ catalog, collection, size }: ScanModeProps) {
  const { register, isAdmin } = useImageRegister();
  const { toast } = useToaster();

  const ordered = useMemo(() => {
    const list = bromidesByCollection(catalog, collection.id, size).sort(
      (a, b) => (a.memberId ?? '').localeCompare(b.memberId ?? '') || a.no - b.no
    );
    const missing = list.filter((b) => !b.imageUrl);
    const has = list.filter((b) => b.imageUrl);
    return [...missing, ...has];
  }, [catalog, collection.id, size]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [collection.id, size]);

  const total = ordered.length;
  const clamped = Math.min(index, Math.max(0, total - 1));
  const current: Bromide | undefined = ordered[clamped];

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, total - 1)));
  }, [total]);

  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const confirm = useCallback(
    async (file: File) => {
      if (!current) return;
      const ok = await register(file, current.id);
      if (ok) advance();
    },
    [current, register, advance]
  );

  const bulkQueue = useMemo(() => ordered.slice(clamped), [ordered, clamped]);

  const commitBulk = useCallback(
    async (items: { bromide: Bromide; file: File }[]) => {
      let ok = 0;
      for (const it of items) {
        if (await register(it.file, it.bromide.id, true)) ok += 1;
      }
      toast({
        title: isAdmin ? `${ok} 件を登録しました` : `${ok} 件を投稿しました（承認待ち）`,
        type: 'success'
      });
      setIndex((i) => Math.min(i + ok, Math.max(0, total - 1)));
    },
    [register, isAdmin, toast, total]
  );

  if (total === 0) {
    return (
      <Center py="16">
        <Text color="fg.muted" fontSize="sm">
          ブロマイドがありません
        </Text>
      </Center>
    );
  }

  const allDone = ordered.every((b) => b.imageUrl);

  return (
    <Stack gap="5">
      <HStack gap="2" alignItems="center" flexWrap="wrap">
        {isAdmin ? (
          <Badge size="md" variant="solid" colorPalette="green">
            <FaBolt />
            即時反映
          </Badge>
        ) : (
          <Badge size="md" variant="subtle" colorPalette="amber">
            承認後に公開
          </Badge>
        )}
        <Text color="fg.muted" fontSize="xs">
          画像のないブロマイドから順番に撮影していきます
        </Text>
      </HStack>

      {allDone ? (
        <Box
          borderColor="board.border"
          borderRadius="2xl"
          borderWidth="1px"
          py="6"
          px="4"
          bgColor="board.owned"
        >
          <Stack gap="2" alignItems="center" textAlign="center">
            <Box color="green.9" fontSize="3xl">
              <FaCircleCheck />
            </Box>
            <Text fontSize="md" fontWeight="bold">
              すべてのブロマイドに画像があります
            </Text>
            <Text color="fg.muted" fontSize="xs">
              撮り直したい場合は下から進めてください
            </Text>
          </Stack>
        </Box>
      ) : null}

      {current ? (
        <CameraStep
          catalog={catalog}
          bromide={current}
          total={total}
          isAdmin={isAdmin}
          onConfirm={confirm}
          onBack={back}
          onSkip={advance}
          canBack={clamped > 0}
          canForward={clamped < total - 1}
          position={clamped + 1}
        />
      ) : null}

      <Box borderColor="board.border" borderTopWidth="1px" pt="4">
        <Stack gap="2">
          <Text color="fg.muted" fontSize="xs" fontWeight="bold">
            まとめて読み込み（PC向け）
          </Text>
          <BulkDropZone
            catalog={catalog}
            queue={bulkQueue}
            isAdmin={isAdmin}
            onCommit={commitBulk}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
