import { useMemo, useState } from 'react';
import { FaCircleCheck, FaTrashCan, FaWandMagicSparkles } from 'react-icons/fa6';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import { useOwnership } from '~/hooks/useOwnership';
import type { Catalog, Collection } from '~/types';
import { bromidesByCollection } from '~/utils/stats';
import { FocusEntry } from './FocusEntry';
import { QUICK_MAX, QuickGrid } from './QuickGrid';

type Layout = 'grid' | 'focus';

const LAYOUT_ITEMS: { value: Layout; label: string }[] = [
  { value: 'grid', label: 'グリッド' },
  { value: 'focus', label: '集中' }
];

interface QuickRegisterProps {
  catalog: Catalog;
  collection: Collection;
  size?: string;
}

export function QuickRegister({ catalog, collection, size }: QuickRegisterProps) {
  const { ownership, setCount, increment } = useOwnership();
  const { toast } = useToaster();
  const [layout, setLayout] = useState<Layout>('grid');

  const bromides = useMemo(
    () => bromidesByCollection(catalog, collection.id, size),
    [catalog, collection.id, size]
  );

  const countOf = (id: string) => ownership[id] ?? 0;
  const cycle = (id: string) => {
    const c = ownership[id] ?? 0;
    setCount(id, c >= QUICK_MAX ? 0 : c + 1);
  };
  const reset = (id: string) => setCount(id, 0);

  const setAllOwned = () => {
    for (const b of bromides) setCount(b.id, Math.max(1, ownership[b.id] ?? 0));
    toast({ title: '全部を所持にしました', type: 'success' });
  };

  const fillMissing = () => {
    let n = 0;
    for (const b of bromides) {
      if ((ownership[b.id] ?? 0) === 0) {
        setCount(b.id, 1);
        n += 1;
      }
    }
    toast({ title: n > 0 ? `未所持 ${n} 件を1にしました` : '未所持はありません', type: 'success' });
  };

  const resetAll = () => {
    if (!window.confirm(`「${collection.title}」の所持記録をすべてリセットしますか？`)) return;
    for (const b of bromides) setCount(b.id, 0);
    toast({ title: 'リセットしました', type: 'info' });
  };

  return (
    <Stack gap="4">
      <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <SegmentGroup.Root
          value={layout}
          onValueChange={(e) => setLayout(e.value as Layout)}
          size="sm"
        >
          <SegmentGroup.Indicator />
          {LAYOUT_ITEMS.map((item) => (
            <SegmentGroup.Item key={item.value} value={item.value}>
              <SegmentGroup.ItemText>{item.label}</SegmentGroup.ItemText>
              <SegmentGroup.ItemControl />
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root>

        {layout === 'grid' ? (
          <Text color="fg.subtle" fontSize="2xs">
            タップで 0→1→2→3、長押し/右クリックで0
          </Text>
        ) : null}
      </HStack>

      <Wrap gap="2">
        <Button onClick={setAllOwned} size="sm" variant="subtle">
          <FaCircleCheck />
          全部所持にする
        </Button>
        <Button onClick={fillMissing} size="sm" variant="subtle">
          <FaWandMagicSparkles />
          未所持を1にする
        </Button>
        <Button onClick={resetAll} size="sm" variant="ghost" colorPalette="gray">
          <FaTrashCan />
          リセット
        </Button>
      </Wrap>

      <Box>
        {layout === 'grid' ? (
          <QuickGrid
            catalog={catalog}
            collection={collection}
            size={size}
            countOf={countOf}
            onCycle={cycle}
            onReset={reset}
          />
        ) : (
          <FocusEntry
            catalog={catalog}
            collection={collection}
            size={size}
            countOf={countOf}
            onSet={setCount}
            onIncrement={(id) => increment(id)}
          />
        )}
      </Box>
    </Stack>
  );
}
