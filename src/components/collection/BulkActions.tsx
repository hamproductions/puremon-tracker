import { useState } from 'react';
import { FaCircleCheck, FaTrashCan } from 'react-icons/fa6';
import { HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import type { Catalog, Collection } from '~/types';
import { bromidesByCollection } from '~/utils/stats';

interface BulkActionsProps {
  catalog: Catalog;
  collection: Collection;
  ownership: Record<string, number>;
  setCount: (id: string, n: number) => void;
}

export function BulkActions({ catalog, collection, ownership, setCount }: BulkActionsProps) {
  const { toast } = useToaster();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bromides = bromidesByCollection(catalog, collection.id);

  const fillAll = () => {
    for (const b of bromides) setCount(b.id, Math.max(1, ownership[b.id] ?? 0));
    toast({ title: 'すべて所持にしました', type: 'success' });
  };

  const resetAll = () => {
    for (const b of bromides) setCount(b.id, 0);
    setConfirmOpen(false);
    toast({ title: 'このコレクションをリセットしました', type: 'info' });
  };

  return (
    <HStack gap="2" flexWrap="wrap">
      <Button size="sm" variant="subtle" onClick={fillAll}>
        <FaCircleCheck />
        全部所持にする
      </Button>

      <Dialog.Root open={confirmOpen} onOpenChange={(e) => setConfirmOpen(e.open)}>
        <Dialog.Trigger asChild>
          <Button size="sm" variant="outline" colorPalette="gray">
            <FaTrashCan />
            リセット
          </Button>
        </Dialog.Trigger>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Stack gap="4" p="6">
              <Stack gap="1.5">
                <Dialog.Title>コレクションをリセット</Dialog.Title>
                <Dialog.Description asChild>
                  <Text color="fg.muted" fontSize="sm">
                    「{collection.title}
                    」の所持データをすべて0に戻します。この操作は元に戻せません。
                  </Text>
                </Dialog.Description>
              </Stack>
              <HStack gap="2" justifyContent="flex-end">
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost">キャンセル</Button>
                </Dialog.CloseTrigger>
                <Button onClick={resetAll} colorPalette="red">
                  リセットする
                </Button>
              </HStack>
            </Stack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </HStack>
  );
}
