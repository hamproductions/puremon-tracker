import { Badge } from '~/components/ui/badge';
import type { SubmissionStatus } from '~/types';

const MAP: Record<SubmissionStatus, { label: string; colorPalette: 'amber' | 'green' | 'gray' }> = {
  pending: { label: '審査中', colorPalette: 'amber' },
  approved: { label: '承認済', colorPalette: 'green' },
  rejected: { label: '却下', colorPalette: 'gray' }
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, colorPalette } = MAP[status];
  return (
    <Badge variant="subtle" size="sm" colorPalette={colorPalette}>
      {label}
    </Badge>
  );
}
