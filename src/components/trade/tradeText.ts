import type { Bromide, Catalog } from '~/types';
import { memberMap } from '~/utils/stats';

export type TradeMethod = 'mail' | 'handover' | 'either';
export type TradeFormat = 'detail' | 'compact';

export interface TradeConditions {
  method: TradeMethod;
  mailNote: string;
  deadline: string;
  message: string;
  contact: string;
}

export interface GiveItem {
  bromide: Bromide;
  qty: number;
}

export interface TradeInput {
  catalog: Catalog;
  gives: GiveItem[];
  wants: Bromide[];
  conditions: TradeConditions;
}

export const DEFAULT_CONDITIONS: TradeConditions = {
  method: 'either',
  mailNote: '',
  deadline: '',
  message: '',
  contact: ''
};

export const TWEET_LIMIT = 280;

const HASHTAGS_DETAIL = '#ピュアリーモンスター #ピュアモン #譲渡';
const HASHTAGS_COMPACT = '#ピュアモン譲渡';

function methodLabel(method: TradeMethod, mailNote: string): string {
  const mail = mailNote.trim() ? `郵送（${mailNote.trim()}）` : '郵送';
  switch (method) {
    case 'mail':
      return mail;
    case 'handover':
      return '手渡し';
    default:
      return `${mail} / 手渡し`;
  }
}

function methodLabelCompact(method: TradeMethod): string {
  switch (method) {
    case 'mail':
      return '郵送';
    case 'handover':
      return '手渡し';
    default:
      return '郵送/手渡し';
  }
}

function fullName(catalog: Catalog, b: Bromide): string {
  if (!b.memberId) return '集合';
  return memberMap(catalog).get(b.memberId)?.name ?? b.memberId;
}

function shortName(catalog: Catalog, b: Bromide): string {
  if (!b.memberId) return '集合';
  const m = memberMap(catalog).get(b.memberId);
  return m?.nickname ?? m?.name ?? b.memberId;
}

function giveDetail(catalog: Catalog, item: GiveItem): string {
  return `${fullName(catalog, item.bromide)} No.${item.bromide.no} ×${item.qty}`;
}

function wantDetail(catalog: Catalog, b: Bromide): string {
  return `${fullName(catalog, b)} No.${b.no}`;
}

interface MemberGroup {
  key: string;
  name: string;
  parts: string[];
}

function groupByMember(
  catalog: Catalog,
  entries: { bromide: Bromide; suffix: string }[]
): MemberGroup[] {
  const order = new Map<string, number>();
  catalog.members.forEach((m, i) => order.set(m.id, i));
  const groups = new Map<string, MemberGroup>();
  for (const { bromide, suffix } of entries) {
    const key = bromide.memberId ?? '__group__';
    if (!groups.has(key)) {
      groups.set(key, { key, name: shortName(catalog, bromide), parts: [] });
    }
    groups.get(key)!.parts.push(`${bromide.no}${suffix}`);
  }
  return [...groups.values()].sort((a, b) => {
    const oa = a.key === '__group__' ? Infinity : (order.get(a.key) ?? Infinity);
    const ob = b.key === '__group__' ? Infinity : (order.get(b.key) ?? Infinity);
    return oa - ob;
  });
}

function compactSide(catalog: Catalog, entries: { bromide: Bromide; suffix: string }[]): string {
  return groupByMember(catalog, entries)
    .map((g) => `${g.name}${g.parts.join(',')}`)
    .join(' ');
}

export function buildDetailText(input: TradeInput): string {
  const { catalog, gives, wants, conditions } = input;
  const lines: string[] = ['【ピュアリーモンスター ブロマイド 譲渡】'];

  if (gives.length > 0) {
    lines.push(`譲：${gives.map((g) => giveDetail(catalog, g)).join(' / ')}`);
  }
  if (wants.length > 0) {
    lines.push(`求：${wants.map((w) => wantDetail(catalog, w)).join(' / ')}`);
  }

  lines.push(`方法：${methodLabel(conditions.method, conditions.mailNote)}`);

  if (conditions.deadline.trim()) {
    lines.push(`〆切：${conditions.deadline.trim()}`);
  }
  if (conditions.message.trim()) {
    lines.push(conditions.message.trim());
  }

  const contact = conditions.contact.trim();
  lines.push(contact ? `${contact}まで💌` : 'DMまでお願いします💌');
  lines.push(HASHTAGS_DETAIL);

  return lines.join('\n');
}

export function buildCompactText(input: TradeInput): string {
  const { catalog, gives, wants, conditions } = input;
  const segments: string[] = ['【ぷれもんブロマイド】'];

  if (gives.length > 0) {
    const give = compactSide(
      catalog,
      gives.map((g) => ({ bromide: g.bromide, suffix: g.qty > 1 ? `×${g.qty}` : '' }))
    );
    segments.push(`譲)${give}`);
  }
  if (wants.length > 0) {
    const want = compactSide(
      catalog,
      wants.map((w) => ({ bromide: w, suffix: '' }))
    );
    segments.push(`求)${want}`);
  }

  segments.push(methodLabelCompact(conditions.method));

  const contact = conditions.contact.trim();
  segments.push(contact ? `${contact}までDM` : 'DMください');

  return `${segments.join(' ')} ${HASHTAGS_COMPACT}`;
}

export function buildTradeText(input: TradeInput, format: TradeFormat): string {
  return format === 'compact' ? buildCompactText(input) : buildDetailText(input);
}
