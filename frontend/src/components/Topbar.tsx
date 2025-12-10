import dayjs from 'dayjs';
import { useMemo } from 'react';
type Props = {
  onSearch?: (term: string) => void;
};

export const Topbar = (_props: Props) => {
  const quarterInfo = useMemo(() => {
    const now = dayjs();
    const quarter = Math.floor(now.month() / 3) + 1;
    return `${now.year()} • ${quarter}. Çeyrek`;
  }, []);

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">
          NC
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary-light">Norax Credentials</p>
          <h2 className="text-lg font-semibold text-white">Güvenli Erişim Paneli</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-primary/40 bg-primary/20 px-4 py-3 text-xs text-white/80 min-h-[80px] flex flex-col justify-center shadow-neon">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Çeyrek</p>
          <p className="text-sm font-semibold text-white">{quarterInfo}</p>
          <p className="text-[11px] text-white/60">Güvenli oturum + API key aktif</p>
        </div>
      </div>
    </div>
  );
};
