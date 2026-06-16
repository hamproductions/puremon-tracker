import { forwardRef } from 'react';
import { Box, Grid, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import type { Catalog, Member, OwnershipMap } from '~/types';
import { bromideCount, collectionStats, memberMap, overallStats } from '~/utils/stats';

interface MemberRowStat {
  member: Member;
  owned: number;
  total: number;
}

function memberRowStats(catalog: Catalog, ownership: OwnershipMap): MemberRowStat[] {
  const mm = memberMap(catalog);
  const memberGrid = new Set(
    catalog.collections.filter((c) => c.kind === 'member_grid').map((c) => c.id)
  );
  return catalog.members
    .map((member) => {
      let owned = 0;
      let total = 0;
      for (const b of catalog.bromides) {
        if (b.memberId !== member.id || !memberGrid.has(b.collectionId)) continue;
        total += 1;
        if (bromideCount(ownership, b) >= 1) owned += 1;
      }
      return { member: mm.get(member.id) ?? member, owned, total };
    })
    .filter((r) => r.total > 0);
}

interface ExportPosterProps {
  catalog: Catalog;
  ownership: OwnershipMap;
}

export const ExportPoster = forwardRef<HTMLDivElement, ExportPosterProps>(
  ({ catalog, ownership }, ref) => {
    const overall = overallStats(catalog, ownership);
    const memberRows = memberRowStats(catalog, ownership);
    const today = new Date();
    const dateLabel = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(
      today.getDate()
    ).padStart(2, '0')} 時点`;

    return (
      <Box
        ref={ref}
        style={{
          background: 'linear-gradient(160deg, #2a1430 0%, #3a1838 45%, #1c1020 100%)',
          color: '#ffffff'
        }}
        position="relative"
        w="720px"
        p="10"
        overflow="hidden"
      >
        <Box
          style={{ background: 'radial-gradient(circle, #ff5fa255 0%, transparent 70%)' }}
          position="absolute"
          top="-120px"
          right="-100px"
          borderRadius="full"
          w="360px"
          h="360px"
        />
        <Box
          style={{ background: 'radial-gradient(circle, #9b5de544 0%, transparent 70%)' }}
          position="absolute"
          left="-120px"
          bottom="-140px"
          borderRadius="full"
          w="400px"
          h="400px"
        />

        <Stack position="relative" gap="7">
          <Stack gap="2">
            <HStack gap="2.5" alignItems="center">
              <Box style={{ backgroundColor: '#ff5fa2' }} borderRadius="full" w="3" h="3" />
              <Text style={{ color: '#f5b8d4' }} fontSize="sm" letterSpacing="0.18em">
                MY BROMIDE COLLECTION
              </Text>
            </HStack>
            <Text textStyle="display" style={{ color: '#ffffff' }} fontSize="3xl" lineHeight="1.2">
              ピュアリーモンスター
              <br />
              ブロマイド コレクション
            </Text>
          </Stack>

          <HStack
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
            gap="6"
            justifyContent="space-between"
            alignItems="flex-end"
            borderRadius="2xl"
            p="6"
          >
            <Stack gap="0.5">
              <Text style={{ color: '#e7c9da' }} fontSize="sm">
                コンプ率
              </Text>
              <HStack gap="1.5" alignItems="baseline">
                <Text
                  textStyle="display"
                  style={{ color: '#ff8fc0' }}
                  fontSize="6xl"
                  lineHeight="1"
                >
                  {overall.percent}
                </Text>
                <Text textStyle="display" style={{ color: '#ff8fc0' }} fontSize="2xl">
                  %
                </Text>
              </HStack>
            </Stack>
            <Stack gap="2" alignItems="flex-end">
              <HStack gap="4">
                <PosterStat
                  label="所持"
                  value={`${overall.owned}/${overall.total}`}
                  accent="#ffffff"
                />
                <PosterStat label="不足" value={`${overall.missing}`} accent="#f5b8d4" />
                <PosterStat label="ダブり" value={`${overall.duplicates}`} accent="#ffd58a" />
              </HStack>
              <Box
                style={{ background: 'rgba(255,255,255,0.14)' }}
                borderRadius="full"
                w="280px"
                h="10px"
              >
                <Box
                  style={{
                    width: `${overall.percent}%`,
                    background: 'linear-gradient(90deg, #ff5fa2 0%, #9b5de5 100%)'
                  }}
                  borderRadius="full"
                  h="full"
                />
              </Box>
            </Stack>
          </HStack>

          <Stack gap="3">
            <Text style={{ color: '#e7c9da' }} fontSize="sm" letterSpacing="0.12em">
              コレクション別
            </Text>
            <Stack gap="2.5">
              {catalog.collections.map((c) => {
                const s = collectionStats(catalog, c.id, ownership);
                return (
                  <Stack key={c.id} gap="1.5">
                    <HStack justifyContent="space-between" alignItems="baseline">
                      <Text style={{ color: '#ffffff' }} fontSize="sm" fontWeight="bold" truncate>
                        {c.title}
                      </Text>
                      <Text
                        style={{ color: '#e7c9da' }}
                        fontSize="xs"
                        fontVariantNumeric="tabular-nums"
                      >
                        {s.owned}/{s.total}・{s.percent}%
                      </Text>
                    </HStack>
                    <Box
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                      borderRadius="full"
                      w="full"
                      h="8px"
                    >
                      <Box
                        style={{
                          width: `${s.percent}%`,
                          background: 'linear-gradient(90deg, #ff7ab0 0%, #c47ce8 100%)'
                        }}
                        borderRadius="full"
                        h="full"
                      />
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Stack>

          {memberRows.length > 0 ? (
            <Stack gap="3">
              <Text style={{ color: '#e7c9da' }} fontSize="sm" letterSpacing="0.12em">
                メンバー別 達成度
              </Text>
              <Grid gap="3" columns={2}>
                {memberRows.map(({ member, owned, total }) => {
                  const pct = total === 0 ? 0 : Math.round((owned / total) * 100);
                  return (
                    <HStack
                      key={member.id}
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                      gap="3"
                      alignItems="center"
                      borderRadius="xl"
                      py="2.5"
                      px="3.5"
                    >
                      <Box
                        style={{ backgroundColor: member.color }}
                        flexShrink="0"
                        borderRadius="full"
                        w="8"
                        h="8"
                      />
                      <Stack flex="1" gap="1" minW="0">
                        <HStack justifyContent="space-between" alignItems="baseline">
                          <Text
                            style={{ color: '#ffffff' }}
                            fontSize="sm"
                            fontWeight="bold"
                            truncate
                          >
                            {member.name}
                          </Text>
                          <Text
                            style={{ color: '#e7c9da' }}
                            fontSize="xs"
                            fontVariantNumeric="tabular-nums"
                          >
                            {owned}/{total}
                          </Text>
                        </HStack>
                        <Box
                          style={{ background: 'rgba(255,255,255,0.12)' }}
                          borderRadius="full"
                          w="full"
                          h="6px"
                        >
                          <Box
                            style={{ width: `${pct}%`, backgroundColor: member.color }}
                            borderRadius="full"
                            h="full"
                          />
                        </Box>
                      </Stack>
                    </HStack>
                  );
                })}
              </Grid>
            </Stack>
          ) : null}

          <HStack
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
            justifyContent="space-between"
            alignItems="center"
            pt="2"
          >
            <Text style={{ color: '#b89aae' }} fontSize="xs">
              {catalog.group.name} 非公式ファンツール
            </Text>
            <Text style={{ color: '#b89aae' }} fontSize="xs" fontVariantNumeric="tabular-nums">
              {dateLabel}
            </Text>
          </HStack>
        </Stack>
      </Box>
    );
  }
);

ExportPoster.displayName = 'ExportPoster';

function PosterStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Stack gap="0.5" alignItems="flex-end">
      <Text style={{ color: '#e7c9da' }} fontSize="xs">
        {label}
      </Text>
      <Text
        textStyle="display"
        style={{ color: accent }}
        fontSize="xl"
        fontVariantNumeric="tabular-nums"
        lineHeight="1"
      >
        {value}
      </Text>
    </Stack>
  );
}

export function buildShareText(catalog: Catalog, ownership: OwnershipMap): string {
  const overall = overallStats(catalog, ownership);
  const lines: string[] = [];
  lines.push('ピュアリーモンスター ブロマイド コレクション');
  lines.push(`コンプ率 ${overall.percent}%（所持 ${overall.owned}/${overall.total} 枚）`);
  lines.push(`不足 ${overall.missing} ／ ダブり ${overall.duplicates}`);
  lines.push('');
  for (const c of catalog.collections) {
    const s = collectionStats(catalog, c.id, ownership);
    lines.push(`■ ${c.title} ${s.owned}/${s.total}（${s.percent}%）`);
  }
  lines.push('');
  lines.push('#ピュアリーモンスター #ブロマイド');
  return lines.join('\n');
}
