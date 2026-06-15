import { useState } from 'react';
import { FaChevronRight, FaCircleCheck } from 'react-icons/fa6';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Badge } from '~/components/ui/badge';
import { Link } from '~/components/ui/link';
import { Text } from '~/components/ui/text';
import type { Bromide, Catalog, Collection, OwnershipMap } from '~/types';
import { bromideLabel, missingBromides } from '~/utils/stats';
import { toAppUrl } from '~/utils/url';

const PREVIEW = 12;

interface MissingViewProps {
  catalog: Catalog;
  ownership: OwnershipMap;
  collections: Collection[];
  memberFilter: Set<string>;
}

function passesMember(b: Bromide, memberFilter: Set<string>): boolean {
  if (memberFilter.size === 0) return true;
  if (b.memberId === null) return true;
  return memberFilter.has(b.memberId);
}

export function MissingView({ catalog, ownership, collections, memberFilter }: MissingViewProps) {
  const groups = collections
    .map((c) => ({
      collection: c,
      items: missingBromides(catalog, ownership, c.id).filter((b) => passesMember(b, memberFilter))
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <Stack
        gap="2"
        alignItems="center"
        borderColor="board.border"
        borderRadius="2xl"
        borderWidth="1px"
        py="10"
        textAlign="center"
        bgColor="board.panel"
      >
        <Box color="green.9" fontSize="3xl">
          <FaCircleCheck />
        </Box>
        <Text fontWeight="bold">不足はありません</Text>
        <Text color="fg.muted" fontSize="sm">
          この条件のブロマイドはすべて所持しています。
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="6">
      {groups.map(({ collection, items }) => (
        <MissingGroup key={collection.id} catalog={catalog} collection={collection} items={items} />
      ))}
    </Stack>
  );
}

function MissingGroup({
  catalog,
  collection,
  items
}: {
  catalog: Catalog;
  collection: Collection;
  items: Bromide[];
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, PREVIEW);
  const rest = items.length - shown.length;

  return (
    <Stack gap="2.5">
      <HStack justifyContent="space-between" alignItems="baseline">
        <Link
          href={toAppUrl(`/collections?c=${collection.id}`)}
          fontSize="sm"
          fontWeight="bold"
          _hover={{ color: 'accent.text', textDecoration: 'none' }}
        >
          {collection.title}
        </Link>
        <Badge size="sm" variant="subtle" colorPalette="gray">
          不足 {items.length}
        </Badge>
      </HStack>
      <Grid gap="2" columns={{ base: 2, sm: 3, md: 4 }}>
        {shown.map((b) => {
          const color = b.memberId ? memberColorOf(catalog, b.memberId) : '#FF5FA2';
          return (
            <Link
              key={b.id}
              href={toAppUrl(`/collections?c=${collection.id}`)}
              aria-label={`${memberShort(catalog, b)} ${b.size ? `${b.size}・` : ''}No.${b.no} を記録`}
              _hover={{ textDecoration: 'none' }}
            >
              <HStack
                cursor="pointer"
                gap="2"
                alignItems="center"
                borderColor="board.border"
                borderRadius="lg"
                borderWidth="1px"
                minW="0"
                py="2"
                px="2.5"
                bgColor="board.missing"
                transition="border-color 0.12s"
                borderStyle="dashed"
                _hover={{ borderColor: 'accent.default', borderStyle: 'solid' }}
              >
                <Box
                  style={{ backgroundColor: color }}
                  flexShrink="0"
                  borderRadius="full"
                  w="2"
                  h="full"
                  minH="8"
                />
                <Stack flex="1" gap="0" minW="0">
                  <Text fontSize="sm" fontWeight="medium" truncate>
                    {memberShort(catalog, b)}
                  </Text>
                  <Text color="fg.muted" fontSize="xs" fontVariantNumeric="tabular-nums">
                    {b.size ? `${b.size}・` : ''}No.{b.no}
                  </Text>
                </Stack>
                <Box flexShrink="0" color="fg.subtle">
                  <FaChevronRight size={10} />
                </Box>
              </HStack>
            </Link>
          );
        })}
      </Grid>
      {rest > 0 || expanded ? (
        <Box
          as="button"
          onClick={() => setExpanded((v) => !v)}
          alignSelf="center"
          mt="0.5"
          color="accent.text"
          fontSize="xs"
          fontWeight="bold"
          _hover={{ textDecoration: 'underline' }}
        >
          {expanded ? '閉じる' : `残り ${rest} 件を表示`}
        </Box>
      ) : null}
    </Stack>
  );
}

function memberColorOf(catalog: Catalog, memberId: string): string {
  return catalog.members.find((m) => m.id === memberId)?.color ?? '#FF5FA2';
}

function memberShort(catalog: Catalog, b: Bromide): string {
  if (!b.memberId) return '集合';
  const m = catalog.members.find((x) => x.id === b.memberId);
  return m?.nickname ?? bromideLabel(catalog, b);
}
