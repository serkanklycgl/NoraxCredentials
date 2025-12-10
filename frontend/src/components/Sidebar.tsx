import { Category } from '@/types';
import { HiOutlineCloud, HiOutlineKey, HiOutlineServer, HiOutlineShieldCheck } from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

type Props = {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (id: string) => void;
};

const iconForCategory = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('sunucu') || normalized.includes('server')) return <HiOutlineServer />;
  if (normalized.includes('üçüncü') || normalized.includes('3')) return <HiOutlineCloud />;
  if (normalized.includes('iç') || normalized.includes('internal')) return <HiOutlineShieldCheck />;
  return <HiOutlineKey />;
};

export const Sidebar = ({ categories, selectedCategoryId, onSelect }: Props) => {
  const { user, logout } = useAuth();
  const initials = (() => {
    const email = user?.email ?? '';
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || 'NC';
  })();

  return (
    <aside className="flex h-full flex-col gap-4 bg-gradient-to-b from-[#0c0c12] to-[#050507] border-r border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-black font-bold grid place-items-center shadow-neon">
            NC
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">Norax</p>
            <p className="text-lg font-semibold text-white">Credentials Hub</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">Sunucu, RDP, connection string ve üçüncü parti erişimleri tek panelden yönetin.</p>
      </div>

      <div className="px-4 py-4 space-y-2 overflow-y-auto scrollbar">
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary-light">Kategoriler</p>
            <h3 className="text-base font-semibold text-white">Güvenlik Segmentleri</h3>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-light">
            {categories.length}
          </span>
        </div>
        {categories.map((category) => {
          const active = category.id === selectedCategoryId;
          return (
            <div
              key={category.id}
              className={`group relative overflow-hidden rounded-2xl border px-3 py-3 ${
                active
                  ? 'border-primary/60 bg-primary/10 text-white shadow-glow'
                  : 'border-white/5 bg-white/5 text-slate-200 hover:border-primary/30 hover:bg-white/10'
              }`}
            >
              <span className={`absolute left-0 top-0 h-full w-1 rounded-full ${active ? 'bg-primary' : 'bg-white/10'}`} />
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-primary/25 text-primary-light' : 'bg-white/10 text-slate-300'}`}>
                  {iconForCategory(category.name)}
                </div>
                <button
                  onClick={() => onSelect(category.id)}
                  className="flex-1 text-left outline-none"
                  aria-label={`Select ${category.name}`}
                >
                  <p className="text-sm font-semibold">{category.name}</p>
                  <p className="text-xs text-slate-400">{category.description}</p>
                </button>
              </div>
            </div>
          );
        })}
        {categories.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-3 text-sm text-slate-400">
            Henüz kategori yok.
          </div>
        ) : null}
      </div>

      <div className="mt-auto border-t border-white/5 p-5 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">Oturum</p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white truncate max-w-[150px]">{user?.email ?? '—'}</p>
            <p className="text-[11px] text-white/60">{user?.role ?? 'Kullanıcı'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-glow hover:bg-primary-light transition"
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
};
