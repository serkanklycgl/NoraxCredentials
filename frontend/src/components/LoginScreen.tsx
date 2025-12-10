import { useState } from 'react';
import { HiOutlineLockClosed, HiOutlineMail, HiOutlineKey, HiOutlineShieldCheck } from 'react-icons/hi';

type Props = {
  onLogin: (email: string, password: string, apiKey?: string) => Promise<void>;
};

export const LoginScreen = ({ onLogin }: Props) => {
  const [email, setEmail] = useState('admin@norax.com');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_API_KEY ?? 'norax-dev-key');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(email.trim(), password.trim(), apiKey.trim() || undefined);
    } catch (err: any) {
      setError(err?.message ?? 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-925 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(225,29,72,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(244,63,94,0.2),transparent_25%)]" />
      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl lg:grid-cols-5">
        <div className="col-span-2 hidden bg-gradient-to-b from-primary-dark via-primary to-primary-light p-8 text-white lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Norax Security</p>
          <h1 className="mt-4 text-3xl font-bold">Credentials Vault</h1>
          <p className="mt-3 text-sm text-white/80">
            Sunucu, bağlantı stringi ve üçüncü parti erişimlerini kırmızı temalı modern arayüzde güvenle yönetin.
          </p>
          <div className="mt-10 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                <HiOutlineShieldCheck />
              </span>
              <div>
                <p className="font-semibold">AES-256 Şifreleme</p>
                <p className="text-white/70">Parola ve connection stringler veritabanında şifreli tutulur.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                <HiOutlineLockClosed />
              </span>
              <div>
                <p className="font-semibold">API Key koruması</p>
                <p className="text-white/70">Backend isteklerine X-API-KEY otomatik eklenir.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary-light">Norax Credentials</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Giriş Yap</h2>
              <p className="text-sm text-slate-400">Devam etmek için hesabınızla oturum açın.</p>
            </div>
            <div className="rounded-full bg-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-light">
              Kırmızı Tema
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">E-posta</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-primary">
                <HiOutlineMail className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="admin@norax.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Parola</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-primary">
                <HiOutlineLockClosed className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">API Key (opsiyonel)</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-primary">
                <HiOutlineKey className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="X-API-KEY"
                />
              </div>
              <p className="text-xs text-slate-500">Backend ile eşleşen anahtarı girin; boş bırakırsanız env değerini kullanır.</p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
