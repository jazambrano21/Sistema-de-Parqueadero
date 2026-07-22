import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-700">{title}</p>
        {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
