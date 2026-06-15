import { FaRegCopy, FaXTwitter } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import { copyTextToClipboard, xShareUrl } from '~/utils/share';
import { TWEET_LIMIT, type TradeFormat } from './tradeText';

const FORMAT_ITEMS: { value: TradeFormat; label: string }[] = [
  { value: 'detail', label: '詳細' },
  { value: 'compact', label: 'コンパクト' }
];

interface PreviewCardProps {
  text: string;
  format: TradeFormat;
  onFormatChange: (format: TradeFormat) => void;
  handle?: string;
  hasContent: boolean;
}

export function PreviewCard({
  text,
  format,
  onFormatChange,
  handle,
  hasContent
}: PreviewCardProps) {
  const { toast } = useToaster();
  const count = [...text].length;
  const over = count > TWEET_LIMIT;

  const copy = async () => {
    try {
      await copyTextToClipboard(text);
      toast({ title: 'テキストをコピーしました', type: 'success' });
    } catch {
      toast({ title: 'コピーに失敗しました', type: 'error' });
    }
  };

  return (
    <Stack gap="4">
      <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Text fontSize="sm" fontWeight="bold">
          プレビュー
        </Text>
        <SegmentGroup.Root
          value={format}
          onValueChange={(e) => onFormatChange(e.value as TradeFormat)}
          size="sm"
        >
          <SegmentGroup.Indicator />
          {FORMAT_ITEMS.map((item) => (
            <SegmentGroup.Item key={item.value} value={item.value}>
              <SegmentGroup.ItemText>{item.label}</SegmentGroup.ItemText>
              <SegmentGroup.ItemControl />
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root>
      </HStack>

      <Box
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p={{ base: '4', md: '5' }}
        bgColor="board.panelSolid"
        boxShadow="0 8px 28px -18px rgba(155, 27, 63, 0.35)"
      >
        <HStack gap="3" alignItems="center" mb="3">
          <Box
            display="flex"
            flexShrink="0"
            justifyContent="center"
            alignItems="center"
            borderRadius="full"
            w="10"
            h="10"
            bgGradient="to-br"
            gradientFrom="accent.default"
            gradientTo="accent.emphasized"
            color="accent.fg"
            fontSize="sm"
            fontWeight="bold"
          >
            {handle ? handle.charAt(0).toUpperCase() : 'P'}
          </Box>
          <Stack gap="0" minW="0">
            <Text fontSize="sm" fontWeight="bold" truncate>
              {handle ? handle : 'あなた'}
            </Text>
            <Text color="fg.muted" fontSize="xs" truncate>
              {handle ? `@${handle}` : '@your_handle'}
            </Text>
          </Stack>
          <Box ml="auto" color="fg.subtle" fontSize="lg">
            <FaXTwitter />
          </Box>
        </HStack>

        <Box
          as="pre"
          minH="6rem"
          color={hasContent ? 'fg.default' : 'fg.muted'}
          fontFamily="body"
          fontSize="sm"
          lineHeight="1.7"
          wordBreak="break-word"
          whiteSpace="pre-wrap"
        >
          {hasContent ? text : '譲・求を選択するとここにツイート文が表示されます。'}
        </Box>

        <HStack
          justifyContent="flex-end"
          borderColor="board.border"
          borderTopWidth="1px"
          mt="3"
          pt="3"
        >
          <Text
            color={over ? 'red.10' : count > TWEET_LIMIT * 0.9 ? 'amber.10' : 'fg.muted'}
            fontSize="xs"
            fontWeight="bold"
            fontVariantNumeric="tabular-nums"
          >
            {count} / {TWEET_LIMIT}
          </Text>
        </HStack>
      </Box>

      <HStack gap="2" flexWrap="wrap">
        <Button onClick={copy} disabled={!hasContent} flex={{ base: '1', sm: 'none' }}>
          <FaRegCopy />
          コピー
        </Button>
        <Button
          asChild
          variant="outline"
          disabled={!hasContent || over}
          flex={{ base: '1', sm: 'none' }}
        >
          <a
            href={hasContent && !over ? xShareUrl(text) : undefined}
            target="_blank"
            rel="noreferrer noopener"
            aria-disabled={!hasContent || over}
            onClick={(e) => {
              if (!hasContent || over) e.preventDefault();
            }}
          >
            <FaXTwitter />
            Xでツイート
          </a>
        </Button>
      </HStack>

      {over ? (
        <Text color="red.10" fontSize="xs">
          280文字を超えています。譲・求の数を減らすか、コンパクト形式をお試しください。
        </Text>
      ) : null}
    </Stack>
  );
}
