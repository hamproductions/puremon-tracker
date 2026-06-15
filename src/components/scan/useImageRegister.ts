import { useCallback } from 'react';
import { useToaster } from '~/context/ToasterContext';
import { useAuth } from '~/hooks/useAuth';
import { catalogActions } from '~/hooks/useCatalog';
import { uploadBromideImage } from '~/lib/storage';
import { getSupabase } from '~/lib/supabase';
import { submissionsStore } from '~/data/store';
import type { Submission } from '~/types';

export function useImageRegister() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToaster();

  const register = useCallback(
    async (file: File, bromideId: string, silent = false): Promise<boolean> => {
      try {
        const result = await uploadBromideImage(file, bromideId);
        if (isAdmin) {
          catalogActions.setBromideImage(bromideId, result.url);
          if (!silent) toast({ title: '登録しました', type: 'success' });
        } else {
          const sub: Submission = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            bromideId,
            imageUrl: result.url,
            status: 'pending',
            submittedBy: profile?.id ?? 'local',
            submittedHandle: profile?.handle,
            createdAt: new Date().toISOString()
          };
          submissionsStore.update((prev) => [sub, ...prev]);
          const sb = getSupabase();
          if (sb && profile) {
            try {
              await sb.from('submissions').insert({
                id: sub.id,
                bromide_id: sub.bromideId,
                image_url: sub.imageUrl,
                status: sub.status,
                submitted_by: sub.submittedBy,
                submitted_handle: sub.submittedHandle ?? null,
                created_at: sub.createdAt
              });
            } catch {
              /* best-effort */
            }
          }
          if (!silent) toast({ title: '投稿しました（承認待ち）', type: 'success' });
        }
        return true;
      } catch {
        if (!silent) toast({ title: '登録に失敗しました', type: 'error' });
        return false;
      }
    },
    [isAdmin, profile, toast]
  );

  return { register, isAdmin };
}
