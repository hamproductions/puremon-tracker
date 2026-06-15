import { useEffect, useMemo, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { FaCloudArrowUp, FaPaperPlane, FaUsersRectangle } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { SegmentGroup } from '~/components/ui/segment-group';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { Metadata } from '~/components/layout/Metadata';
import { CollectionPills } from '~/components/submit/CollectionPills';
import { MySubmissions } from '~/components/submit/MySubmissions';
import { TargetGrid } from '~/components/submit/TargetGrid';
import { UploadField } from '~/components/submit/UploadField';
import { useToaster } from '~/context/ToasterContext';
import { useAuth } from '~/hooks/useAuth';
import { useCatalog } from '~/hooks/useCatalog';
import { useMounted } from '~/hooks/useMounted';
import { submissionsStore, useStore } from '~/data/store';
import { getSupabase } from '~/lib/supabase';
import { blobToDataUrl, prepareImageBlob, uploadBromideImage } from '~/lib/storage';
import type { Bromide, Submission } from '~/types';
import { activeSizeOf, bromideLabel } from '~/utils/stats';

function StepHead({ n, title }: { n: number; title: string }) {
  return (
    <HStack gap="2" alignItems="center">
      <Box
        display="flex"
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
        {n}
      </Box>
      <Heading fontSize="md">{title}</Heading>
    </HStack>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      borderColor="board.border"
      borderRadius="2xl"
      borderWidth="1px"
      p={{ base: '4', md: '5' }}
      bgColor="board.panel"
      backdropFilter="blur(8px)"
    >
      {children}
    </Box>
  );
}

export default function Page() {
  const ctx = usePageContext();
  const initialBromideId = ctx.urlParsed.search['b'];
  const catalog = useCatalog();
  const mounted = useMounted();
  const { profile } = useAuth();
  const { toast } = useToaster();
  const allSubs = useStore(submissionsStore);

  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [target, setTarget] = useState<Bromide | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || catalog.bromides.length === 0) return;
    if (initialBromideId) {
      const b = catalog.bromides.find((x) => x.id === initialBromideId);
      if (b) {
        setCollectionId(b.collectionId);
        setSize(b.size ?? undefined);
        setTarget(b);
        setSeeded(true);
        return;
      }
    }
    setCollectionId((prev) => prev ?? catalog.collections[0]?.id ?? null);
    setSeeded(true);
  }, [seeded, initialBromideId, catalog.bromides, catalog.collections]);

  const collection = useMemo(
    () => catalog.collections.find((c) => c.id === collectionId) ?? null,
    [catalog.collections, collectionId]
  );

  const activeSize = collection ? (activeSizeOf(collection, size) ?? undefined) : undefined;

  const mine = useMemo(() => {
    const me = profile?.id ?? 'local';
    return allSubs.filter((s) => s.submittedBy === me);
  }, [allSubs, profile?.id]);

  const pickFile = async (f: File) => {
    setFile(f);
    try {
      const blob = await prepareImageBlob(f);
      setPreview(await blobToDataUrl(blob));
    } catch {
      setPreview(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setNote('');
  };

  const submit = async () => {
    if (!target || !file) return;
    setBusy(true);
    try {
      const result = await uploadBromideImage(file, target.id);
      const sub: Submission = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        bromideId: target.id,
        imageUrl: result.url,
        status: 'pending',
        note: note.trim() || undefined,
        submittedBy: profile?.id ?? 'local',
        submittedHandle: profile?.handle,
        createdAt: new Date().toISOString()
      };
      submissionsStore.update((prev) => [sub, ...prev]);

      const sb = getSupabase();
      if (sb && profile) {
        try {
          await sb.from('submissions').insert({
            id: sub.id,
            bromide_id: sub.bromideId,
            image_url: sub.imageUrl,
            status: sub.status,
            note: sub.note ?? null,
            submitted_by: sub.submittedBy,
            submitted_handle: sub.submittedHandle ?? null,
            created_at: sub.createdAt
          });
        } catch {
          /* best-effort */
        }
      }

      toast({
        title: '投稿しました',
        description:
          result.mode === 'cloud'
            ? '管理者の承認後に公開されます'
            : 'この端末に保存しました（承認後に表示）',
        type: 'success'
      });
      reset();
    } catch {
      toast({ title: '投稿に失敗しました', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = Boolean(target && file) && !busy;

  return (
    <Stack gap="6" pt="2">
      <Metadata title="画像投稿" helmet />

      <Stack gap="1">
        <HStack gap="2" alignItems="center">
          <Box color="accent.default" fontSize="lg">
            <FaUsersRectangle />
          </Box>
          <Heading textStyle="display" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.1">
            画像投稿
          </Heading>
        </HStack>
        <Text maxW="2xl" color="fg.muted" fontSize="sm">
          みんなでブロマイド画像を集めよう。手元のブロマイドを撮って投稿すると、承認後にみんなのコレクション図鑑に反映されます。ログインは不要です。
        </Text>
      </Stack>

      <Panel>
        <Stack gap="3">
          <StepHead n={1} title="コレクションを選ぶ" />
          {mounted ? (
            <CollectionPills
              collections={catalog.collections}
              value={collectionId}
              onSelect={(id) => {
                setCollectionId(id);
                setSize(catalog.collections.find((c) => c.id === id)?.sizes?.[0]);
                setTarget(null);
              }}
            />
          ) : (
            <Box h="9" />
          )}
          {mounted && collection?.sizes?.length ? (
            <HStack gap="2.5" alignItems="center" flexWrap="wrap">
              <Text color="fg.muted" fontSize="xs" fontWeight="bold">
                サイズ
              </Text>
              <SegmentGroup.Root
                value={activeSize ?? ''}
                onValueChange={(e) => {
                  setSize(e.value);
                  setTarget(null);
                }}
                size="sm"
                orientation="horizontal"
              >
                <SegmentGroup.Indicator />
                {collection.sizes.map((s) => (
                  <SegmentGroup.Item key={s} value={s}>
                    <SegmentGroup.ItemText>{s}</SegmentGroup.ItemText>
                    <SegmentGroup.ItemControl />
                    <SegmentGroup.ItemHiddenInput />
                  </SegmentGroup.Item>
                ))}
              </SegmentGroup.Root>
            </HStack>
          ) : null}
        </Stack>
      </Panel>

      <Panel>
        <Stack gap="3">
          <HStack gap="2" justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <StepHead n={2} title="投稿する種類を選ぶ" />
            {target ? (
              <Text color="accent.text" fontSize="xs" fontWeight="bold">
                選択中：{bromideLabel(catalog, target)}
              </Text>
            ) : (
              <Text color="fg.muted" fontSize="xs">
                <Box as="span" color="accent.default" fontWeight="bold">
                  画像募集中
                </Box>
                を優先して集めています
              </Text>
            )}
          </HStack>
          {mounted && collection ? (
            <Box maxH="md" pr="1" overflowY="auto">
              <TargetGrid
                catalog={catalog}
                collection={collection}
                size={activeSize}
                selectedId={target?.id ?? null}
                onSelect={setTarget}
              />
            </Box>
          ) : (
            <Box h="24" />
          )}
        </Stack>
      </Panel>

      <Panel>
        <Stack gap="4">
          <StepHead n={3} title="画像とひとことを送る" />
          <UploadField preview={preview} onPick={pickFile} />
          <Stack gap="1.5">
            <Text as="label" color="fg.muted" fontSize="xs" fontWeight="bold">
              ひとこと（任意）
            </Text>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="どこで撮影したか、状態など"
              rows={2}
              outline="none"
              borderColor="border.default"
              borderRadius="l2"
              borderWidth="1px"
              py="2"
              px="3"
            />
          </Stack>
          <Button onClick={submit} disabled={!canSubmit} loading={busy} size="lg">
            <FaPaperPlane />
            投稿する
          </Button>
          {!target || !file ? (
            <Text color="fg.muted" fontSize="xs" textAlign="center">
              <FaCloudArrowUp style={{ display: 'inline', marginRight: 4 }} />
              種類を選んで画像を添付すると投稿できます。
            </Text>
          ) : null}
        </Stack>
      </Panel>

      <Stack gap="3">
        <Heading fontSize="md">あなたの投稿</Heading>
        {mounted ? <MySubmissions catalog={catalog} submissions={mine} /> : <Box h="20" />}
      </Stack>
    </Stack>
  );
}
