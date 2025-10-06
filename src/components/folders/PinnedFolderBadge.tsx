import { Pin } from 'lucide-react';

interface PinnedFolderBadgeProps {
  className?: string;
}

export function PinnedFolderBadge({ className = '' }: PinnedFolderBadgeProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} title="Pinned folder">
      <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />
    </div>
  );
}
