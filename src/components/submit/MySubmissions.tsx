import { Box, HStack, Stack, styled } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { StatusBadge } from '~/components/submit/StatusBadge';
import type { Bromide, Catalog, Submission } from '~/types';
import { bromideLabel } from '~/utils/stats';

const Img = styled('img');

interface MySubmissionsProps {
  catalog: Catalog;
  submissions: Submission[];
}

export function MySubmissions({ catalog, submissions }: MySubmissionsProps) {
  const byId = new Map(catalog.bromides.map((b) => [b.id, b]));

  if (submissions.length === 0) {
    return (
      <Box
        borderColor="board.border"
        borderRadius="lg"
        borderWidth="1px"
        py="6"
        textAlign="center"
        borderStyle="dashed"
      >
        <Text color="fg.muted" fontSize="sm">
          まだ投稿はありません。
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="2">
      {submissions.map((s) => {
        const bromide: Bromide | undefined = byId.get(s.bromideId);
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
              w="12"
              h="16"
              bgColor="board.tile"
              overflow="hidden"
            >
              <Img src={s.imageUrl} alt="" objectFit="cover" w="full" h="full" />
            </Box>
            <Stack flex="1" gap="1" minW="0">
              <Text fontSize="sm" fontWeight="bold" truncate>
                {bromide ? bromideLabel(catalog, bromide) : s.bromideId}
              </Text>
              {s.note ? (
                <Text color="fg.muted" fontSize="xs" truncate>
                  {s.note}
                </Text>
              ) : null}
            </Stack>
            <StatusBadge status={s.status} />
          </HStack>
        );
      })}
    </Stack>
  );
}
