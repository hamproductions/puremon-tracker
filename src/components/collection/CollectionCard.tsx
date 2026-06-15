import { FaCalendar, FaChevronRight } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { ProgressBar, StatPills } from '~/components/bromide/Progress';
import type { Catalog, Collection } from '~/types';
import { collectionStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';
import { collectionColors, formatReleaseDate, kindLabel, memberCountLabel } from './format';

interface CollectionCardProps {
  catalog: Catalog;
  collection: Collection;
  ownership: Record<string, number>;
  mounted: boolean;
}

export function CollectionCard({ catalog, collection, ownership, mounted }: CollectionCardProps) {
  const stats = collectionStats(catalog, collection.id, ownership);
  const colors = collectionColors(catalog, collection).slice(0, 7);
  const date = formatReleaseDate(collection.releaseDate);

  return (
    <Link
      href={toAppUrl(`/collections?c=${collection.id}`)}
      display="block"
      _hover={{ textDecoration: 'none' }}
    >
      <Stack
        gap="2.5"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        p="4"
        bgColor="board.panelSolid"
        transition="border-color 0.15s, transform 0.15s"
        _hover={{ borderColor: 'accent.default', transform: 'translateY(-2px)' }}
      >
        <HStack gap="2" justifyContent="space-between" alignItems="flex-start">
          <HStack gap="1.5" flexWrap="wrap">
            <Badge
              size="sm"
              variant="subtle"
              colorPalette={collection.kind === 'member_grid' ? 'blue' : 'gray'}
            >
              {kindLabel(collection.kind)}
            </Badge>
            {mounted && stats.percent === 100 ? (
              <Badge size="sm" variant="solid" colorPalette="green">
                コンプ!
              </Badge>
            ) : null}
          </HStack>
          <HStack gap="0.5" flexShrink="0" pt="1">
            {colors.map((c, i) => (
              <Box key={i} style={{ backgroundColor: c }} borderRadius="full" w="2" h="2" />
            ))}
          </HStack>
        </HStack>

        <Stack gap="1">
          <Text fontSize="md" fontWeight="bold" lineHeight="1.3">
            {collection.title}
          </Text>
          {collection.description ? (
            <Text color="fg.muted" fontSize="xs" lineHeight="1.4" truncate>
              {collection.description}
            </Text>
          ) : null}
        </Stack>

        <HStack gap="3" color="fg.subtle" fontSize="xs" flexWrap="wrap">
          {date ? (
            <HStack gap="1">
              <FaCalendar size={11} />
              <Text fontSize="xs">{date}</Text>
            </HStack>
          ) : null}
          <Text fontSize="xs">{memberCountLabel(collection)}</Text>
          <Text fontSize="xs">全 {stats.total} 枚</Text>
        </HStack>

        <Stack gap="2" pt="1">
          <ProgressBar percent={mounted ? stats.percent : 0} />
          <HStack justifyContent="space-between" alignItems="center">
            <StatPills stats={stats} mounted={mounted} />
            <Box color="fg.subtle">
              <FaChevronRight size={12} />
            </Box>
          </HStack>
        </Stack>
      </Stack>
    </Link>
  );
}
