import { useRef, useState } from 'react';
import { FaCopy, FaDownload, FaXmark } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Heading } from '~/components/ui/heading';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import type { Catalog, OwnershipMap } from '~/types';
import { copyTextToClipboard, downloadElementAsImage } from '~/utils/share';
import { ExportPoster, buildShareText } from './ExportPoster';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: Catalog;
  ownership: OwnershipMap;
}

export function ExportDialog({ open, onOpenChange, catalog, ownership }: ExportDialogProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const { toast } = useToaster();
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!posterRef.current) return;
    setBusy(true);
    try {
      await downloadElementAsImage(posterRef.current, 'puremon-mycollection.png', '#1c1020');
      toast({ title: '画像を保存しました', type: 'success' });
    } catch {
      toast({ title: '画像の保存に失敗しました', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(buildShareText(catalog, ownership));
      toast({ title: 'テキストをコピーしました', type: 'success' });
    } catch {
      toast({ title: 'コピーに失敗しました', type: 'error' });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} lazyMount unmountOnExit>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          display="flex"
          flexDirection="column"
          w="full"
          maxW={{ base: '92vw', md: '780px' }}
          maxH="90vh"
          bgColor="board.panelSolid"
          overflow="hidden"
        >
          <HStack justifyContent="space-between" alignItems="center" p="4" pb="2">
            <Stack gap="0.5">
              <Dialog.Title asChild>
                <Heading fontSize="lg">画像で保存</Heading>
              </Dialog.Title>
              <Text color="fg.muted" fontSize="xs">
                Twitter / X にそのまま投稿できる画像を作成します。
              </Text>
            </Stack>
            <Dialog.CloseTrigger asChild>
              <IconButton size="sm" variant="ghost" aria-label="閉じる">
                <FaXmark />
              </IconButton>
            </Dialog.CloseTrigger>
          </HStack>

          <Box
            display="flex"
            flex="1"
            justifyContent="center"
            py="2"
            px="4"
            bgColor="bg.muted"
            overflow="auto"
          >
            <Box
              style={{ transform: 'scale(min(1, calc((100vw - 120px) / 720)))' }}
              transformOrigin="top center"
            >
              <ExportPoster ref={posterRef} catalog={catalog} ownership={ownership} />
            </Box>
          </Box>

          <HStack gap="2" justifyContent="flex-end" p="4" pt="3" flexWrap="wrap">
            <Button variant="outline" onClick={handleCopy}>
              <FaCopy />
              テキストでコピー
            </Button>
            <Button onClick={handleSave} loading={busy}>
              <FaDownload />
              画像で保存
            </Button>
          </HStack>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
