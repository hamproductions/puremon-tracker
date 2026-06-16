import { useQuery } from '@tanstack/react-query';
import { Box, Grid, HStack, Stack, styled } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { Text } from '~/components/ui/text';
import { StatusBadge } from '~/components/submit/StatusBadge';
import { fetchMySubmissions } from '~/data/remote';
import { useAuth } from '~/hooks/useAuth';
import { isSupabaseConfigured } from '~/lib/supabase';
import type { Catalog } from '~/types';
import { DEFAULT_BROMIDE_ASPECT, bromideAspectRatio } from '~/utils/aspect';
import { bromideLabel } from '~/utils/stats';

const Img = styled('img');

export function MySubmissions({ catalog }: { catalog: Catalog }) {
  const { profile } = useAuth();
  const userId = isSupabaseConfigured ? profile?.id : null;
  const query = useQuery({
    queryKey: ['my-submissions', userId],
    queryFn: fetchMySubmissions,
    enabled: Boolean(userId)
  });
  const submissions = query.data ?? [];
  if (!userId || submissions.length === 0) return null;
  const byId = new Map(catalog.bromides.map((b) => [b.id, b]));

  return (
    <Stack gap="3">
      <Heading fontSize="md">マイ投稿</Heading>
      <Grid gap="3" gridTemplateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}>
        {submissions.map((s) => {
          const bromide = byId.get(s.bromideId);
          return (
            <Stack
              key={s.id}
              gap="1.5"
              borderColor="board.border"
              borderRadius="lg"
              borderWidth="1px"
              p="2"
            >
              <Box
                style={{
                  aspectRatio: bromide ? bromideAspectRatio(bromide) : DEFAULT_BROMIDE_ASPECT
                }}
                position="relative"
                borderRadius="md"
                w="full"
                bgColor="bg.muted"
                overflow="hidden"
              >
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
              <HStack gap="1" justifyContent="space-between" alignItems="center">
                <Text color="fg.muted" fontSize="2xs" lineClamp={1}>
                  {bromide ? bromideLabel(catalog, bromide) : s.bromideId}
                </Text>
                <StatusBadge status={s.status} />
              </HStack>
            </Stack>
          );
        })}
      </Grid>
    </Stack>
  );
}
