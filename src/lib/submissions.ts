import { getSupabase } from '~/lib/supabase';
import { submissionsStore } from '~/data/store';
import { hasE2EProfile } from '~/lib/e2eAuth';
import type { Profile, Submission } from '~/types';

interface CreateImageSubmissionInput {
  bromideId: string;
  imageUrl: string;
  profile?: Profile | null;
  note?: string;
  now?: string;
  id?: string;
}

export function createImageSubmission({
  bromideId,
  imageUrl,
  profile,
  note,
  now,
  id
}: CreateImageSubmissionInput): Submission {
  if (!profile) throw new Error('login required');
  return {
    id: id ?? newSubmissionId(),
    bromideId,
    imageUrl,
    status: 'pending',
    note: note?.trim() || undefined,
    submittedBy: profile.id,
    submittedHandle: profile.handle,
    createdAt: now ?? new Date().toISOString()
  };
}

export async function saveImageSubmission(submission: Submission): Promise<void> {
  if (hasE2EProfile()) {
    submissionsStore.update((prev) => [submission, ...prev]);
    return;
  }

  const sb = getSupabase();
  if (!sb) throw new Error('supabase required');
  const { error } = await sb.from('submissions').insert({
    id: submission.id,
    bromide_id: submission.bromideId,
    image_url: submission.imageUrl,
    status: submission.status,
    note: submission.note ?? null,
    submitted_by: submission.submittedBy,
    submitted_handle: submission.submittedHandle ?? null,
    created_at: submission.createdAt
  });
  if (error) throw error;
}

function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
