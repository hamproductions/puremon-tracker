import { Grid, Stack } from 'styled-system/jsx';
import { Input } from '~/components/ui/input';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import type { TradeConditions, TradeMethod } from './tradeText';

const METHOD_ITEMS: { value: TradeMethod; label: string }[] = [
  { value: 'mail', label: '郵送' },
  { value: 'handover', label: '手渡し' },
  { value: 'either', label: 'どちらでも' }
];

function FieldLabel({ children }: { children: string }) {
  return (
    <Text as="label" color="fg.muted" fontSize="xs" fontWeight="bold">
      {children}
    </Text>
  );
}

interface ConditionsPanelProps {
  value: TradeConditions;
  onChange: (next: TradeConditions) => void;
}

export function ConditionsPanel({ value, onChange }: ConditionsPanelProps) {
  const patch = (p: Partial<TradeConditions>) => onChange({ ...value, ...p });

  return (
    <Stack gap="4">
      <Stack gap="1.5">
        <FieldLabel>譲渡方法</FieldLabel>
        <SegmentGroup.Root
          value={value.method}
          onValueChange={(e) => patch({ method: e.value as TradeMethod })}
          size="sm"
        >
          <SegmentGroup.Indicator />
          {METHOD_ITEMS.map((item) => (
            <SegmentGroup.Item key={item.value} value={item.value}>
              <SegmentGroup.ItemText>{item.label}</SegmentGroup.ItemText>
              <SegmentGroup.ItemControl />
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root>
      </Stack>

      <Grid gap="3" columns={{ base: 1, sm: 2 }}>
        <Stack gap="1.5">
          <FieldLabel>郵送条件</FieldLabel>
          <Input
            value={value.mailNote}
            onChange={(e) => patch({ mailNote: e.target.value })}
            placeholder="63円〜 / 送料負担"
            disabled={value.method === 'handover'}
          />
        </Stack>
        <Stack gap="1.5">
          <FieldLabel>〆切</FieldLabel>
          <Input
            value={value.deadline}
            onChange={(e) => patch({ deadline: e.target.value })}
            placeholder="6/30 / 急ぎません"
          />
        </Stack>
      </Grid>

      <Stack gap="1.5">
        <FieldLabel>連絡先</FieldLabel>
        <Input
          value={value.contact}
          onChange={(e) => patch({ contact: e.target.value })}
          placeholder="@your_handle / DMまで"
        />
      </Stack>

      <Stack gap="1.5">
        <FieldLabel>ひとこと</FieldLabel>
        <Textarea
          value={value.message}
          onChange={(e) => patch({ message: e.target.value })}
          placeholder="お気軽にお声がけください。郵送のみ対応です等"
          rows={2}
          outline="none"
          borderColor="border.default"
          borderRadius="l2"
          borderWidth="1px"
          py="2"
          px="3"
          color="fg.default"
          fontSize="sm"
          lineHeight="1.4"
          bgColor="bg.default"
          resize="vertical"
          _placeholder={{ color: 'fg.muted' }}
          _focusVisible={{ borderColor: 'border.emphasized' }}
        />
      </Stack>
    </Stack>
  );
}
