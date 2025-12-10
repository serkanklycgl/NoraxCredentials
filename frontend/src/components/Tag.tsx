import { ReactNode } from 'react';
import clsx from 'clsx';

type TagProps = {
  children: ReactNode;
  tone?: 'primary' | 'muted';
};

export const Tag = ({ children, tone = 'muted' }: TagProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
      tone === 'primary'
        ? 'bg-primary/15 text-primary-light border border-primary/30'
        : 'bg-white/5 text-slate-300 border border-white/5',
    )}
  >
    {children}
  </span>
);
