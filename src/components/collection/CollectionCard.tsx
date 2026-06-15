import { FaCalendar, FaChevronRight } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import { ProgressBar, StatPills } from '~/components/bromide/Progress';
import type { Catalog, Collection } from '~/types';
import { collectionStats } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';
import {
  collectionColors,
  formatReleaseDate,
  gradientFromColors,
  kindLabel,
  memberCountLabel
} from './format';

interface CollectionCardProps {
  catalog: Catalog;
  collection: Collection;
  ownership: Record<string, number>;
  mounted: boolean;
}

export function CollectionCard({ catalog, collection, ownership, mounted }: CollectionCardProps) {
  const stats = collectionStats(catalog, collection.id, ownership);
  const colors = collectionColors(catalog, collection);
  const date = formatReleaseDate(collection.releaseDate);

  return (
    <Link
      href={toAppUrl(`/collections?c=${collection.id}`)}
      display="block"
      h="full"
      _hover={{ textDecoration: 'none' }}
    >
      <Stack
        gap="0"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        h="full"
        bgColor="board.tile"
        overflow="hidden"
        transition="border-color 0.15s, transform 0.15s, box-shadow 0.15s"
        _hover={{ borderColor: 'accent.default', transform: 'translateY(-2px)', boxShadow: 'md' }}
      >
        <Box style={{ background: gradientFromColors(colors) }} position="relative" h="20">
          <Box
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.28) 100%)'
            }}
            inset="0"
            position="absolute"
          />
          <HStack position="absolute" top="2.5" left="2.5" gap="1.5">
            <Badge
              size="sm"
              variant="solid"
              colorPalette={collection.kind === 'member_grid' ? 'pink' : 'gray'}
            >
              {kindLabel(collection.kind)}
            </Badge>
          </HStack>
          {mounted && stats.percent === 100 ? (
            <Badge
              size="sm"
              variant="solid"
              colorPalette="green"
              position="absolute"
              top="2.5"
              right="2.5"
            >
              コンプ!
            </Badge>
          ) : null}
          <HStack
            position="absolute"
            right="2.5"
            bottom="2"
            gap="0.5"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            opacity={0.92}
          >
            {colors.slice(0, 7).map((c, i) => (
              <Box
                key={i}
                style={{ backgroundColor: c }}
                borderRadius="full"
                w="2"
                h="2"
                boxShadow="0 0 0 1px rgba(255,255,255,0.5)"
              />
            ))}
          </HStack>
        </Box>

        <Stack flex="1" gap="2.5" p="3.5">
          <Stack gap="1">
            <Text fontSize="md" fontWeight="bold" lineHeight="1.3" truncate>
              {collection.title}
            </Text>
            {collection.description ? (
              <Text color="fg.muted" fontSize="xs" lineHeight="1.4" truncate>
                {collection.description}
              </Text>
            ) : null}
          </Stack>

          <HStack gap="3" color="fg.subtle" fontSize="2xs" flexWrap="wrap">
            {date ? (
              <HStack gap="1">
                <FaCalendar size={10} />
                <Text fontSize="2xs">{date}</Text>
              </HStack>
            ) : null}
            <Text fontSize="2xs">{memberCountLabel(collection)}</Text>
            <Text fontSize="2xs">全 {stats.total} 枚</Text>
          </HStack>

          <Stack gap="2" mt="auto" pt="1">
            <ProgressBar percent={mounted ? stats.percent : 0} />
            <HStack justifyContent="space-between" alignItems="center">
              <StatPills stats={stats} mounted={mounted} />
              <Box color="fg.subtle">
                <FaChevronRight size={12} />
              </Box>
            </HStack>
          </Stack>
        </Stack>
      </Stack>
    </Link>
  );
}
