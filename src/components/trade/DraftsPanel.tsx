import { FaRegCopy, FaRegTrashCan, FaXTwitter } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import type { Bromide, Catalog, TradeListing } from '~/types';
import { copyTextToClipboard, xShareUrl } from '~/utils/share';
import { bromideLabel } from '~/utils/stats';
import { DEFAULT_CONDITIONS, buildTradeText, type GiveItem, type TradeFormat } from './tradeText';

interface DraftsPanelProps {
  catalog: Catalog;
  drafts: TradeListing[];
  ownership: Record<string, number>;
  format: TradeFormat;
  onDelete: (id: string) => void;
}

function summarize(catalog: Catalog, ids: string[]): string {
  const byId = new Map(catalog.bromides.map((b) => [b.id, b]));
  const labels = ids
    .map((id) => byId.get(id))
    .filter((b): b is Bromide => Boolean(b))
    .map((b) => bromideLabel(catalog, b));
  if (labels.length === 0) return '—';
  if (labels.length <= 3) return labels.join('、');
  return `${labels.slice(0, 3).join('、')} 他${labels.length - 3}件`;
}

function regenerate(
  catalog: Catalog,
  draft: TradeListing,
  ownership: Record<string, number>,
  format: TradeFormat
): string {
  const byId = new Map(catalog.bromides.map((b) => [b.id, b]));
  const gives: GiveItem[] = draft.gives
    .map((id) => byId.get(id))
    .filter((b): b is Bromide => Boolean(b))
    .map((b) => ({ bromide: b, qty: Math.max(1, (ownership[b.id] ?? 2) - 1) }));
  const wants = draft.wants.map((id) => byId.get(id)).filter((b): b is Bromide => Boolean(b));
  return buildTradeText(
    {
      catalog,
      gives,
      wants,
      conditions: { ...DEFAULT_CONDITIONS, contact: draft.contact ?? '', message: draft.note ?? '' }
    },
    format
  );
}

export function DraftsPanel({ catalog, drafts, ownership, format, onDelete }: DraftsPanelProps) {
  const { toast } = useToaster();

  if (drafts.length === 0) {
    return (
      <Box
        borderColor="board.border"
        borderRadius="xl"
        borderWidth="1px"
        py="6"
        px="4"
        textAlign="center"
        borderStyle="dashed"
      >
        <Text color="fg.muted" fontSize="sm">
          保存した募集はまだありません。「この募集を保存」で複数の募集をこの端末に残せます。
        </Text>
      </Box>
    );
  }

  const copy = async (text: string) => {
    try {
      await copyTextToClipboard(text);
      toast({ title: 'テキストをコピーしました', type: 'success' });
    } catch {
      toast({ title: 'コピーに失敗しました', type: 'error' });
    }
  };

  return (
    <Stack gap="3">
      {drafts.map((draft) => {
        const text = regenerate(catalog, draft, ownership, format);
        return (
          <Stack
            key={draft.id}
            gap="3"
            borderColor="board.border"
            borderRadius="xl"
            borderWidth="1px"
            p="4"
            bgColor="board.panel"
          >
            <HStack gap="2" justifyContent="space-between" alignItems="flex-start">
              <Text color="fg.subtle" fontSize="2xs" fontVariantNumeric="tabular-nums">
                {new Date(draft.createdAt).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <IconButton
                size="xs"
                variant="ghost"
                aria-label="削除"
                onClick={() => onDelete(draft.id)}
              >
                <FaRegTrashCan />
              </IconButton>
            </HStack>

            <Stack gap="1.5">
              <HStack gap="2" alignItems="baseline" minW="0">
                <Badge size="sm" variant="solid" colorPalette="pink" flexShrink="0">
                  譲 {draft.gives.length}
                </Badge>
                <Text color="fg.muted" fontSize="xs" truncate>
                  {summarize(catalog, draft.gives)}
                </Text>
              </HStack>
              <HStack gap="2" alignItems="baseline" minW="0">
                <Badge size="sm" variant="subtle" colorPalette="gray" flexShrink="0">
                  求 {draft.wants.length}
                </Badge>
                <Text color="fg.muted" fontSize="xs" truncate>
                  {summarize(catalog, draft.wants)}
                </Text>
              </HStack>
            </Stack>

            <HStack gap="2" flexWrap="wrap">
              <Button size="xs" variant="subtle" onClick={() => copy(text)}>
                <FaRegCopy />
                再生成してコピー
              </Button>
              <Button asChild size="xs" variant="ghost">
                <a href={xShareUrl(text)} target="_blank" rel="noreferrer noopener">
                  <FaXTwitter />
                  Xでツイート
                </a>
              </Button>
            </HStack>
          </Stack>
        );
      })}
    </Stack>
  );
}
