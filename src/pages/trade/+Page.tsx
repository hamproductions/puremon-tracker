import { useEffect, useMemo, useState } from 'react';
import { FaArrowRightArrowLeft, FaLayerGroup, FaRegBookmark } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { Metadata } from '~/components/layout/Metadata';
import { CollectionPill } from '~/components/trade/chips';
import { ConditionsPanel } from '~/components/trade/ConditionsPanel';
import { DraftsPanel } from '~/components/trade/DraftsPanel';
import { PreviewCard } from '~/components/trade/PreviewCard';
import { SelectionPanel } from '~/components/trade/SelectionPanel';
import {
  DEFAULT_CONDITIONS,
  buildTradeText,
  type GiveItem,
  type TradeConditions,
  type TradeFormat
} from '~/components/trade/tradeText';
import { tradesStore, useStore } from '~/data/store';
import { useAuth } from '~/hooks/useAuth';
import { useCatalog } from '~/hooks/useCatalog';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useMounted } from '~/hooks/useMounted';
import { countOf, useOwnership } from '~/hooks/useOwnership';
import { useToaster } from '~/context/ToasterContext';
import type { Bromide, TradeListing } from '~/types';
import { duplicateBromides } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

const PREFS_KEY = 'puremon:trade-prefs';

function Panel({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) {
  return (
    <Box
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      p={{ base: '4', md: '6' }}
      bgColor="board.panel"
      backdropFilter="blur(8px)"
      {...rest}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ step, title, desc }: { step: string; title: string; desc?: string }) {
  return (
    <Stack gap="1">
      <HStack gap="2" alignItems="center">
        <Box
          display="flex"
          flexShrink="0"
          justifyContent="center"
          alignItems="center"
          borderRadius="full"
          w="6"
          h="6"
          color="accent.fg"
          fontSize="xs"
          fontWeight="bold"
          bgColor="accent.default"
        >
          {step}
        </Box>
        <Heading fontSize="md">{title}</Heading>
      </HStack>
      {desc ? (
        <Text pl="8" color="fg.muted" fontSize="xs">
          {desc}
        </Text>
      ) : null}
    </Stack>
  );
}

export default function Page() {
  const catalog = useCatalog();
  const { ownership } = useOwnership();
  const { profile } = useAuth();
  const mounted = useMounted();
  const drafts = useStore(tradesStore);
  const { toast } = useToaster();

  const [collectionId, setCollectionId] = useState<string>('all');
  const [format, setFormat] = useState<TradeFormat>('detail');
  const [gives, setGives] = useState<Set<string>>(new Set());
  const [wants, setWants] = useState<Set<string>>(new Set());
  const [prefs, setPrefs] = useLocalStorage<TradeConditions>(PREFS_KEY, DEFAULT_CONDITIONS);

  const conditions = prefs ?? DEFAULT_CONDITIONS;

  const visibleCollections = useMemo(
    () =>
      collectionId === 'all'
        ? catalog.collections
        : catalog.collections.filter((c) => c.id === collectionId),
    [catalog.collections, collectionId]
  );

  const allDuplicates = useMemo(() => duplicateBromides(catalog, ownership), [catalog, ownership]);

  useEffect(() => {
    setGives(new Set(allDuplicates.map((e) => e.bromide.id)));
  }, [allDuplicates]);

  useEffect(() => {
    if (profile?.handle && !conditions.contact.trim()) {
      setPrefs({ ...conditions, contact: `@${profile.handle}` });
    }
    // oxlint-disable-next-line exhaustive-deps
  }, [profile?.handle]);

  const bromideById = useMemo(
    () => new Map(catalog.bromides.map((b) => [b.id, b])),
    [catalog.bromides]
  );

  const giveItems: GiveItem[] = useMemo(
    () =>
      [...gives]
        .map((id) => bromideById.get(id))
        .filter((b): b is Bromide => Boolean(b))
        .sort(compareBromide)
        .map((b) => ({ bromide: b, qty: Math.max(1, countOf(ownership, b.id) - 1) })),
    [gives, bromideById, ownership]
  );

  const wantBromides: Bromide[] = useMemo(
    () =>
      [...wants]
        .map((id) => bromideById.get(id))
        .filter((b): b is Bromide => Boolean(b))
        .sort(compareBromide),
    [wants, bromideById]
  );

  const text = useMemo(
    () => buildTradeText({ catalog, gives: giveItems, wants: wantBromides, conditions }, format),
    [catalog, giveItems, wantBromides, conditions, format]
  );

  const hasContent = giveItems.length > 0 || wantBromides.length > 0;

  const toggle = (setter: typeof setGives) => (id: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setMany = (setter: typeof setGives) => (ids: string[], on: boolean) =>
    setter((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const saveDraft = () => {
    if (!hasContent) {
      toast({ title: '譲・求を選択してください', type: 'warning' });
      return;
    }
    const noteParts = [
      conditions.message.trim(),
      conditions.deadline.trim() ? `〆切 ${conditions.deadline.trim()}` : ''
    ].filter(Boolean);
    const draft: TradeListing = {
      id: `trade-${Date.now()}`,
      ownerId: profile?.id ?? 'local',
      ownerHandle: profile?.handle,
      gives: giveItems.map((g) => g.bromide.id),
      wants: wantBromides.map((b) => b.id),
      note: noteParts.join(' / ') || undefined,
      contact: conditions.contact.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    tradesStore.update((prev) => [draft, ...prev]);
    toast({ title: 'この端末に保存しました', type: 'success' });
  };

  const deleteDraft = (id: string) => tradesStore.update((prev) => prev.filter((d) => d.id !== id));

  const empty = mounted && allDuplicates.length === 0;

  return (
    <Stack gap="6" pt="2">
      <Metadata title="譲渡テキスト作成" helmet />

      <Stack gap="1">
        <HStack gap="2" alignItems="center">
          <Box color="accent.default" fontSize="lg">
            <FaArrowRightArrowLeft />
          </Box>
          <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1">
            譲渡テキスト作成
          </Heading>
        </HStack>
        <Text color="fg.muted" fontSize="sm">
          ダブり（譲）と不足（求）を選ぶだけで、X（旧Twitter）にそのまま貼れる募集文ができます。
        </Text>
      </Stack>

      {empty ? (
        <Panel>
          <Stack gap="4" alignItems="center" py="6" textAlign="center">
            <Box fontSize="4xl">🔁</Box>
            <Stack gap="1">
              <Heading fontSize="lg">ダブりがありません</Heading>
              <Text maxW="md" color="fg.muted" fontSize="sm">
                コレクションで所持枚数を記録すると、ここに譲れるブロマイドが表示されます。
              </Text>
            </Stack>
            <Link href={toAppUrl('/collections')} _hover={{ textDecoration: 'none' }}>
              <Button>
                <FaLayerGroup />
                コレクションを記録する
              </Button>
            </Link>
          </Stack>
        </Panel>
      ) : (
        <>
          <Box mx={{ base: '-4', md: '0' }} px={{ base: '4', md: '0' }} overflowX="auto">
            <HStack gap="1.5" minW="max-content">
              <CollectionPill
                label="すべて"
                active={collectionId === 'all'}
                onClick={() => setCollectionId('all')}
              />
              {catalog.collections.map((c) => (
                <CollectionPill
                  key={c.id}
                  label={c.title}
                  active={collectionId === c.id}
                  onClick={() => setCollectionId(c.id)}
                />
              ))}
            </HStack>
          </Box>

          <Grid gap="6" alignItems="start" columns={{ base: 1, lg: 2 }}>
            <Panel>
              <Stack gap="4">
                <SectionTitle
                  step="1"
                  title="譲・求を選ぶ"
                  desc="出すダブりと集めたい不足を選択します。"
                />
                {mounted ? (
                  <SelectionPanel
                    catalog={catalog}
                    ownership={ownership}
                    collections={visibleCollections}
                    gives={gives}
                    wants={wants}
                    onToggleGive={toggle(setGives)}
                    onToggleWant={toggle(setWants)}
                    onSetGives={setMany(setGives)}
                    onSetWants={setMany(setWants)}
                  />
                ) : (
                  <Text color="fg.muted" fontSize="sm">
                    読み込み中…
                  </Text>
                )}
              </Stack>
            </Panel>

            <Stack gap="6">
              <Panel>
                <Stack gap="4">
                  <SectionTitle step="2" title="条件を入力" desc="この端末に自動で保存されます。" />
                  <ConditionsPanel value={conditions} onChange={(next) => setPrefs(next)} />
                </Stack>
              </Panel>

              <Panel>
                <Stack gap="4">
                  <SectionTitle step="3" title="プレビュー＆投稿" />
                  <PreviewCard
                    text={text}
                    format={format}
                    onFormatChange={setFormat}
                    handle={profile?.handle}
                    hasContent={hasContent}
                  />
                  <Button variant="subtle" onClick={saveDraft} disabled={!hasContent}>
                    <FaRegBookmark />
                    この募集を保存
                  </Button>
                </Stack>
              </Panel>
            </Stack>
          </Grid>

          <Panel>
            <Stack gap="4">
              <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <SectionTitle step="4" title="マイ募集" desc="保存した募集はこの端末に残ります。" />
                {drafts.length > 0 ? (
                  <Badge size="sm" variant="subtle" colorPalette="pink">
                    {drafts.length} 件
                  </Badge>
                ) : null}
              </HStack>
              <DraftsPanel
                catalog={catalog}
                drafts={mounted ? drafts : []}
                ownership={ownership}
                format={format}
                onDelete={deleteDraft}
              />
            </Stack>
          </Panel>
        </>
      )}
    </Stack>
  );
}

function compareBromide(a: Bromide, b: Bromide): number {
  if (a.collectionId !== b.collectionId) return a.collectionId.localeCompare(b.collectionId);
  return a.no - b.no;
}
