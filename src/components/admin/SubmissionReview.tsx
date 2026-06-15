import { useEffect, useState } from 'react';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Heading } from '~/components/ui/heading';
import { Text } from '~/components/ui/text';
import { StatusBadge } from '~/components/submit/StatusBadge';
import { useToaster } from '~/context/ToasterContext';
import { catalogActions } from '~/hooks/useCatalog';
import { submissionsStore, useStore } from '~/data/store';
import { getSupabase } from '~/lib/supabase';
import type { Catalog, Submission, SubmissionStatus } from '~/types';
import { bromideLabel } from '~/utils/stats';

const Img = styled('img');

interface RemoteRow {
  id: string;
  bromide_id: string;
  image_url: string;
  status: SubmissionStatus;
  note: string | null;
  submitted_by: string;
  submitted_handle: string | null;
  created_at: string;
}

function fromRemote(r: RemoteRow): Submission {
  return {
    id: r.id,
    bromideId: r.bromide_id,
    imageUrl: r.image_url,
    status: r.status,
    note: r.note ?? undefined,
    submittedBy: r.submitted_by,
    submittedHandle: r.submitted_handle ?? undefined,
    createdAt: r.created_at
  };
}

export function SubmissionReview({ catalog }: { catalog: Catalog }) {
  const { toast } = useToaster();
  const local = useStore(submissionsStore);
  const [remote, setRemote] = useState<Submission[]>([]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    void (async () => {
      try {
        const { data } = await sb
          .from('submissions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (active && data) setRemote((data as RemoteRow[]).map(fromRemote));
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const merged = mergeById(local, remote);
  const byId = new Map(catalog.bromides.map((b) => [b.id, b]));
  const pending = merged.filter((s) => s.status === 'pending');
  const processed = merged.filter((s) => s.status !== 'pending').slice(0, 12);

  const setStatus = (sub: Submission, status: SubmissionStatus) => {
    submissionsStore.update((prev) => {
      const exists = prev.some((s) => s.id === sub.id);
      if (exists) return prev.map((s) => (s.id === sub.id ? { ...s, status } : s));
      return [{ ...sub, status }, ...prev];
    });
    setRemote((prev) => prev.filter((s) => s.id !== sub.id));

    const sb = getSupabase();
    if (sb) {
      void sb
        .from('submissions')
        .update({ status })
        .eq('id', sub.id)
        .then(
          () => undefined,
          () => undefined
        );
    }
  };

  const approve = (sub: Submission) => {
    catalogActions.setBromideImage(sub.bromideId, sub.imageUrl);
    setStatus(sub, 'approved');
    toast({ title: '承認しました', type: 'success' });
  };

  const reject = (sub: Submission) => {
    setStatus(sub, 'rejected');
    toast({ title: '却下しました', type: 'info' });
  };

  return (
    <Stack gap="6">
      <Stack gap="3">
        <HStack gap="2" alignItems="baseline">
          <Heading fontSize="md">承認待ち</Heading>
          <Text color="fg.muted" fontSize="sm">
            {pending.length}件
          </Text>
        </HStack>

        {pending.length === 0 ? (
          <Box
            borderColor="board.border"
            borderRadius="lg"
            borderWidth="1px"
            py="8"
            textAlign="center"
            borderStyle="dashed"
          >
            <Text color="fg.muted" fontSize="sm">
              承認待ちの投稿はありません。
            </Text>
          </Box>
        ) : (
          <Grid gap="3" columns={{ base: 1, sm: 2, lg: 3 }}>
            {pending.map((s) => {
              const bromide = byId.get(s.bromideId);
              return (
                <Stack
                  key={s.id}
                  gap="0"
                  borderColor="board.border"
                  borderRadius="xl"
                  borderWidth="1px"
                  bgColor="board.panel"
                  overflow="hidden"
                >
                  <Box position="relative" aspectRatio="3 / 4" bgColor="board.tile">
                    <Img
                      src={s.imageUrl}
                      alt=""
                      inset="0"
                      position="absolute"
                      objectFit="cover"
                      w="full"
                      h="full"
                    />
                  </Box>
                  <Stack gap="2" p="3">
                    <Text fontSize="sm" fontWeight="bold" truncate>
                      {bromide ? bromideLabel(catalog, bromide) : s.bromideId}
                    </Text>
                    <Text color="fg.muted" fontSize="xs" truncate>
                      {s.submittedHandle ? `@${s.submittedHandle}` : '匿名（ローカル）'}
                    </Text>
                    {s.note ? (
                      <Text color="fg.default" fontSize="xs" lineClamp={2}>
                        {s.note}
                      </Text>
                    ) : null}
                    <HStack gap="2" pt="1">
                      <Button size="sm" onClick={() => approve(s)} colorPalette="green" flex="1">
                        <FaCheck />
                        承認
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject(s)} flex="1">
                        <FaXmark />
                        却下
                      </Button>
                    </HStack>
                  </Stack>
                </Stack>
              );
            })}
          </Grid>
        )}
      </Stack>

      {processed.length > 0 ? (
        <Stack gap="2">
          <Heading fontSize="md">最近の処理</Heading>
          <Stack gap="2">
            {processed.map((s) => {
              const bromide = byId.get(s.bromideId);
              return (
                <HStack
                  key={s.id}
                  gap="3"
                  borderColor="board.border"
                  borderRadius="lg"
                  borderWidth="1px"
                  p="2.5"
                  bgColor="board.panel"
                >
                  <Box
                    flexShrink={0}
                    borderRadius="md"
                    w="10"
                    h="14"
                    bgColor="board.tile"
                    overflow="hidden"
                  >
                    <Img src={s.imageUrl} alt="" objectFit="cover" w="full" h="full" />
                  </Box>
                  <Text flex="1" minW="0" fontSize="sm" fontWeight="bold" truncate>
                    {bromide ? bromideLabel(catalog, bromide) : s.bromideId}
                  </Text>
                  <StatusBadge status={s.status} />
                </HStack>
              );
            })}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}

function mergeById(local: Submission[], remote: Submission[]): Submission[] {
  const map = new Map<string, Submission>();
  for (const r of remote) map.set(r.id, r);
  for (const l of local) map.set(l.id, l);
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
