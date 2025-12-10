import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
};

export const StatCard = ({ title, value, icon }: Props) => (
  <div className="card flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
      {icon}
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  </div>
);
