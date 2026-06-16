export interface Member {
  id: string;
  name: string;
  nameKana: string;
  nickname: string;
  color: string;
  order: number;
}

export interface Group {
  id: string;
  name: string;
  nameKana: string;
}

export type CollectionKind = 'member_grid' | 'flat' | 'mixed';

export interface BromideSpec {
  slotId?: string;
  legacyIds?: string[];
  memberId: string | null;
  size?: string | null;
  no: number;
  type?: string;
  label?: string;
  aspect?: number;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  releaseDate?: string;
  kind: CollectionKind;
  coverImage?: string;
  memberIds: string[];
  numbers: number[];
  sizes?: string[];
  slots?: BromideSpec[];
  items?: BromideSpec[];
  createdAt: string;
}

export interface Bromide {
  id: string;
  legacyIds: string[];
  collectionId: string;
  memberId: string | null;
  size: string | null;
  no: number;
  type?: string;
  label?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Catalog {
  group: Group;
  members: Member[];
  collections: Collection[];
  bromides: Bromide[];
}

export type OwnershipMap = Record<string, number>;

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  bromideId: string;
  imageUrl: string;
  status: SubmissionStatus;
  note?: string;
  submittedBy: string;
  submittedHandle?: string;
  createdAt: string;
}

export interface TradeListing {
  id: string;
  ownerId: string;
  ownerHandle?: string;
  gives: string[];
  wants: string[];
  note?: string;
  contact?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  handle?: string;
  displayName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}
