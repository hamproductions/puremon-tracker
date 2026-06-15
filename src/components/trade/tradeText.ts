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

function methodLabelCompact(method: TradeMethod, mailNote: string): string {
  const mail = mailNote.trim() ? `郵送(${mailNote.trim()})` : '郵送';
  switch (method) {
    case 'mail':
      return mail;
    case 'handover':
      return '手渡し';
    default:
      return `${mail}/手渡し`;
  }
}

function shortName(catalog: Catalog, b: Bromide): string {
  if (!b.memberId) return '集合';
  const m = memberMap(catalog).get(b.memberId);
  return m?.name ?? b.memberId;
}

function setTitle(catalog: Catalog, b: Bromide): string {
  return catalog.collections.find((c) => c.id === b.collectionId)?.title ?? '';
}

function spansMultipleSets(items: Bromide[]): boolean {
  return new Set(items.map((b) => b.collectionId)).size > 1;
}

function sizePart(b: Bromide): string {
  return b.size ? `${b.size} ` : '';
}

function giveDetail(catalog: Catalog, item: GiveItem, withSet: boolean): string {
  const set = withSet ? `${setTitle(catalog, item.bromide)} ` : '';
  return `${set}${shortName(catalog, item.bromide)} ${sizePart(item.bromide)}No.${item.bromide.no} ×${item.qty}`;
}

function wantDetail(catalog: Catalog, b: Bromide, withSet: boolean): string {
  const set = withSet ? `${setTitle(catalog, b)} ` : '';
  return `${set}${shortName(catalog, b)} ${sizePart(b)}No.${b.no}`;
}

interface MemberGroup {
  key: string;
  name: string;
  memberId: string | null;
  size: string | null;
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
    const key = `${bromide.memberId ?? '__group__'}:${bromide.size ?? ''}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: `${shortName(catalog, bromide)}${bromide.size ? `(${bromide.size})` : ''}`,
        memberId: bromide.memberId,
        size: bromide.size,
        parts: []
      });
    }
    groups.get(key)!.parts.push(`${bromide.no}${suffix}`);
  }
  return [...groups.values()].sort((a, b) => {
    const oa = a.memberId ? (order.get(a.memberId) ?? Infinity) : Infinity;
    const ob = b.memberId ? (order.get(b.memberId) ?? Infinity) : Infinity;
    if (oa !== ob) return oa - ob;
    return (a.size ?? '').localeCompare(b.size ?? '');
  });
}

function compactSide(catalog: Catalog, entries: { bromide: Bromide; suffix: string }[]): string {
  const byCollection = new Map<string, { bromide: Bromide; suffix: string }[]>();
  for (const e of entries) {
    const cid = e.bromide.collectionId;
    if (!byCollection.has(cid)) byCollection.set(cid, []);
    byCollection.get(cid)!.push(e);
  }
  const multi = byCollection.size > 1;
  return [...byCollection.values()]
    .map((es) => {
      const members = groupByMember(catalog, es)
        .map((g) => `${g.name}${g.parts.join(',')}`)
        .join(' ');
      return multi ? `《${setTitle(catalog, es[0].bromide)}》${members}` : members;
    })
    .join(' ');
}

export function buildDetailText(input: TradeInput): string {
  const { catalog, gives, wants, conditions } = input;
  const withSet = spansMultipleSets([...gives.map((g) => g.bromide), ...wants]);
  const lines: string[] = ['【ピュアリーモンスター ブロマイド 譲渡】'];

  if (gives.length > 0) {
    lines.push(`譲：${gives.map((g) => giveDetail(catalog, g, withSet)).join(' / ')}`);
  }
  if (wants.length > 0) {
    lines.push(`求：${wants.map((w) => wantDetail(catalog, w, withSet)).join(' / ')}`);
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

  segments.push(methodLabelCompact(conditions.method, conditions.mailNote));

  if (conditions.deadline.trim()) {
    segments.push(`〆${conditions.deadline.trim()}`);
  }
  if (conditions.message.trim()) {
    segments.push(conditions.message.trim());
  }

  const contact = conditions.contact.trim();
  segments.push(contact ? `${contact}までDM` : 'DMください');

  return `${segments.join(' ')} ${HASHTAGS_COMPACT}`;
}

export function buildTradeText(input: TradeInput, format: TradeFormat): string {
  return format === 'compact' ? buildCompactText(input) : buildDetailText(input);
}
