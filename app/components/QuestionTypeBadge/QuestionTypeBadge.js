'use client';
import { CheckCircle2, Hash, ListChecks, AlignLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  MCQ: { icon: <ListChecks className="h-3 w-3" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  MSQ: { icon: <CheckCircle2 className="h-3 w-3" />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  NAT: { icon: <Hash className="h-3 w-3" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  Descriptive: { icon: <AlignLeft className="h-3 w-3" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
};

export default function QuestionTypeBadge({ type }) {
  const c = TYPE_CONFIG[type] || TYPE_CONFIG.MCQ;
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1 px-1.5 border', c.color)}>
      {c.icon} {type || 'MCQ'}
    </Badge>
  );
}
