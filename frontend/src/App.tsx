import { useEffect, useMemo, useState } from 'react';
import {
  createCredential,
  deleteCredential,
  getCategories,
  getCredentials,
  updateCredential,
  getUsers,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  updateUserAccess,
} from '@/api/client';
import { Category, Credential, ManagedUser } from '@/types';
import { Modal } from '@/components/Modal';
import { StatCard } from '@/components/StatCard';
import { Tag } from '@/components/Tag';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { LoginScreen } from '@/components/LoginScreen';
import { useAuth } from '@/context/AuthContext';
import {
  HiOutlineCloud,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUserAdd,
  HiOutlineUserCircle,
} from 'react-icons/hi';

type CredentialForm = {
  categoryId: string;
  name: string;
  hostOrUrl?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  notes?: string;
  appName?: string;
  appLink?: string;
  accountFirstName?: string;
  accountLastName?: string;
  accountEmail?: string;
  accountRole?: string;
  serverVpnRequired?: boolean;
};

type UserForm = {
  id: string;
  email: string;
  role: string;
  password: string;
  credentialIds: string[];
};

const INTERNAL_CATEGORY_ID = '5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a';
const SERVER_CATEGORY_ID = '70763946-c3b3-4518-aba0-2d09f5068e17';
const EXTERNAL_CATEGORY_ID = '1510d449-f3ae-4ec9-97a7-efb4d7741d97';

const initialCredentialForm: CredentialForm = {
  categoryId: '',
  name: '',
  hostOrUrl: '',
  username: '',
  password: '',
  connectionString: '',
  notes: '',
  appName: '',
  appLink: '',
  accountFirstName: '',
  accountLastName: '',
  accountEmail: '',
  accountRole: '',
  serverVpnRequired: false,
};

const initialUserForm: UserForm = {
  id: '',
  email: '',
  role: 'User',
  password: '',
  credentialIds: [],
};

const trimOrUndefined = (value?: string | null) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const buildPayload = (input: CredentialForm) => ({
  categoryId: input.categoryId,
  name: input.name.trim(),
  hostOrUrl: trimOrUndefined(input.hostOrUrl),
  username: trimOrUndefined(input.username),
  password: trimOrUndefined(input.password),
  connectionString: trimOrUndefined(input.connectionString),
  notes: trimOrUndefined(input.notes),
  appName: trimOrUndefined(input.appName),
  appLink: trimOrUndefined(input.appLink),
  accountFirstName: trimOrUndefined(input.accountFirstName),
  accountLastName: trimOrUndefined(input.accountLastName),
  accountEmail: trimOrUndefined(input.accountEmail),
  accountRole: trimOrUndefined(input.accountRole),
  serverVpnRequired: input.serverVpnRequired ?? false,
});

function App() {
  const { user, login } = useAuth();
  const [activePage, setActivePage] = useState<'credentials' | 'users'>('credentials');
  const [categories, setCategories] = useState<Category[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm);
  const [usersLoading, setUsersLoading] = useState(false);
  const [accessCredentials, setAccessCredentials] = useState<Credential[]>([]);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [credentialForm, setCredentialForm] = useState<CredentialForm>(initialCredentialForm);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';
  const isInternalCategory = useMemo(() => {
    const name = selectedCategory?.name.toLowerCase() ?? '';
    return (
      selectedCategory?.id === INTERNAL_CATEGORY_ID ||
      name.includes('iç') ||
      name.includes('ic') ||
      name.includes('internal')
    );
  }, [selectedCategory]);
  const isServerCategory = useMemo(() => {
    const name = selectedCategory?.name.toLowerCase() ?? '';
    return (
      selectedCategory?.id === SERVER_CATEGORY_ID ||
      name.includes('sunucu') ||
      name.includes('server')
    );
  }, [selectedCategory]);
  const isExternalCategory = useMemo(() => {
    const name = selectedCategory?.name.toLowerCase() ?? '';
    return (
      selectedCategory?.id === EXTERNAL_CATEGORY_ID ||
      name.includes('dış') ||
      name.includes('dis') ||
      name.includes('external') ||
      name.includes('3.') ||
      name.includes('üçüncü') ||
      name.includes('ucuncu')
    );
  }, [selectedCategory]);

  const stats = useMemo(
    () => ({
      totalCategories: categories.length,
      totalCredentials: credentials.length,
      lastUpdated:
        credentials.length > 0
          ? new Date(
              credentials.map((c) => c.updatedAtUtc).sort().slice(-1)[0] ?? new Date().toISOString(),
            ).toLocaleString()
          : '—',
    }),
    [categories.length, credentials],
  );

  const filteredCredentials = useMemo(() => {
    if (!searchTerm.trim()) return credentials;
    const term = searchTerm.toLowerCase();
    return credentials.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.hostOrUrl ?? '').toLowerCase().includes(term) ||
        (c.username ?? '').toLowerCase().includes(term) ||
        (c.appName ?? '').toLowerCase().includes(term) ||
        (c.accountEmail ?? '').toLowerCase().includes(term),
    );
  }, [credentials, searchTerm]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        const first = cats[0]?.id ?? null;
        setSelectedCategoryId(first);
      } catch (err) {
        console.error(err);
        setError('Kategoriler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || activePage !== 'credentials') return;
    if (!selectedCategoryId) {
      setCredentials([]);
      return;
    }
    (async () => {
      try {
        setError(null);
        const creds = await getCredentials(selectedCategoryId);
        setCredentials(creds);
      } catch (err) {
        console.error(err);
        setError('Kayıtlar yüklenemedi.');
      }
    })();
  }, [activePage, selectedCategoryId, user]);

  useEffect(() => {
    setCredentialForm((f) => ({ ...f, categoryId: selectedCategoryId ?? '' }));
  }, [selectedCategoryId]);

  useEffect(() => {
    if (activePage !== 'credentials') {
      setModalOpen(false);
      setEditingCredential(null);
    }
  }, [activePage]);

  useEffect(() => {
    setError(null);
  }, [activePage]);

  useEffect(() => {
    if (!isAdmin && activePage === 'users') {
      setActivePage('credentials');
    }
  }, [activePage, isAdmin]);

  useEffect(() => {
    if (!user || activePage !== 'users' || !isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        setUsersLoading(true);
        setError(null);
        const [usersResp, credsResp] = await Promise.all([getUsers(), getCredentials()]);
        if (cancelled) return;
        const sortedUsers = [...usersResp].sort((a, b) => a.email.localeCompare(b.email));
        const sortedCreds = [...credsResp].sort((a, b) => a.name.localeCompare(b.name));
        setManagedUsers(sortedUsers);
        setAccessCredentials(sortedCreds);
        setUserForm((prev) => {
          if (sortedUsers.length === 0) {
            return { ...initialUserForm };
          }
          const matching = prev.id ? sortedUsers.find((u) => u.id === prev.id) : null;
          const chosen = matching ?? sortedUsers[0];
          return {
            id: chosen.id,
            email: chosen.email,
            role: chosen.role,
            password: '',
            credentialIds: chosen.credentialIds ?? [],
          };
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError('Kullanıcılar yüklenemedi.');
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePage, isAdmin, user]);

  const handleCreateCredential = async () => {
    if (!selectedCategoryId) return;
    // İç Uygulamalar için adı appName'den türet
    const nameForSave =
      isInternalCategory && credentialForm.appName && !credentialForm.name.trim()
        ? credentialForm.appName
        : credentialForm.name;
    if (!nameForSave.trim()) return;
    try {
      const payload = buildPayload({ ...credentialForm, categoryId: selectedCategoryId, name: nameForSave });
      const created = await createCredential(payload);
      setCredentials((prev) => [created, ...prev]);
      setCredentialForm({ ...initialCredentialForm, categoryId: selectedCategoryId });
    } catch (err) {
      console.error(err);
      setError('Kayıt oluşturulamadı.');
    }
  };

  const handleUpdateCredential = async (id: string) => {
    if (!editingCredential) return;
    try {
      const nameForUpdate =
        isInternalCategory && (!editingCredential.name || !editingCredential.name.trim())
          ? editingCredential.appName ?? ''
          : editingCredential.name;
      if (!nameForUpdate.trim()) {
        setError('Ad alanı gerekli.');
        return;
      }
      const payload = buildPayload({
        categoryId: editingCredential.categoryId,
        name: nameForUpdate,
        hostOrUrl: editingCredential.hostOrUrl,
        username: editingCredential.username,
        password: editingCredential.password,
        connectionString: editingCredential.connectionString,
        notes: editingCredential.notes,
        appName: editingCredential.appName,
        appLink: editingCredential.appLink,
        accountFirstName: editingCredential.accountFirstName,
        accountLastName: editingCredential.accountLastName,
        accountEmail: editingCredential.accountEmail,
        accountRole: editingCredential.accountRole,
        serverVpnRequired: editingCredential.serverVpnRequired,
      });
      const updated = await updateCredential(id, payload);
      setCredentials((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setModalOpen(false);
      setEditingCredential(null);
    } catch (err) {
      console.error(err);
      setError('Kayıt güncellenemedi.');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteCredential(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      setError('Kayıt silinemedi.');
    }
  };

  const handleModalSave = async () => {
    if (!editingCredential) return;
    if (editingCredential.id) {
      await handleUpdateCredential(editingCredential.id);
      return;
    }
    try {
      const computedName =
        isInternalCategory && (!editingCredential.name || !editingCredential.name.trim())
          ? editingCredential.appName ?? ''
          : editingCredential.name;
      if (!computedName.trim()) return;
      const payloadForCreate: CredentialForm = {
        categoryId: editingCredential.categoryId,
        name: computedName,
        hostOrUrl: editingCredential.hostOrUrl,
        username: editingCredential.username,
        password: editingCredential.password,
        connectionString: editingCredential.connectionString,
        notes: editingCredential.notes,
        appName: editingCredential.appName,
        appLink: editingCredential.appLink,
        accountFirstName: editingCredential.accountFirstName,
        accountLastName: editingCredential.accountLastName,
        accountEmail: editingCredential.accountEmail,
        accountRole: editingCredential.accountRole,
        serverVpnRequired: editingCredential.serverVpnRequired,
      };
      const normalizedPayload = buildPayload(payloadForCreate);
      const created = await createCredential(normalizedPayload);
      setCredentials((prev) => [created, ...prev]);
      setModalOpen(false);
      setEditingCredential(null);
    } catch (err) {
      console.error(err);
      setError('Kayıt oluşturulamadı.');
    }
  };

  const handleSelectManagedUser = (id: string) => {
    const selected = managedUsers.find((u) => u.id === id);
    if (!selected) return;
    setUserForm({
      id: selected.id,
      email: selected.email,
      role: selected.role,
      password: '',
      credentialIds: selected.credentialIds ?? [],
    });
  };

  const handleUserSave = async () => {
    const email = userForm.email.trim().toLowerCase();
    if (!email) {
      setError('E-posta gerekli.');
      return;
    }
    try {
      setError(null);
      if (userForm.id) {
        const payload: { email: string; role: string; password?: string } = {
          email,
          role: userForm.role.trim() || 'User',
        };
        if (userForm.password.trim()) {
          payload.password = userForm.password.trim();
        }
        const updated = await updateManagedUser(userForm.id, payload);
        setManagedUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setUserForm({
          id: updated.id,
          email: updated.email,
          role: updated.role,
          password: '',
          credentialIds: updated.credentialIds ?? [],
        });
      } else {
        if (!userForm.password.trim()) {
          setError('Parola gerekli.');
          return;
        }
        const created = await createManagedUser({
          email,
          password: userForm.password.trim(),
          role: userForm.role.trim() || 'User',
        });
        setManagedUsers((prev) => [...prev, created].sort((a, b) => a.email.localeCompare(b.email)));
        setUserForm({
          id: created.id,
          email: created.email,
          role: created.role,
          password: '',
          credentialIds: created.credentialIds ?? [],
        });
      }
    } catch (err) {
      console.error(err);
      setError('Kullanıcı kaydedilemedi.');
    }
  };

  const handleUserAccessSave = async () => {
    if (!userForm.id) {
      setError('Önce kullanıcı seçin veya oluşturun.');
      return;
    }
    try {
      setError(null);
      const updated = await updateUserAccess(userForm.id, userForm.credentialIds);
      setManagedUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setUserForm((prev) => ({
        ...prev,
        credentialIds: updated.credentialIds ?? [],
      }));
    } catch (err) {
      console.error(err);
      setError('Erişim güncellenemedi.');
    }
  };

  const handleDeleteManagedUser = async (id: string) => {
    if (id === user?.id) {
      setError('Kendi hesabınızı silemezsiniz.');
      return;
    }
    if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteManagedUser(id);
      setManagedUsers((prev) => prev.filter((u) => u.id !== id));
      setUserForm((prev) => (prev.id === id ? { ...initialUserForm } : prev));
    } catch (err) {
      console.error(err);
      setError('Kullanıcı silinemedi.');
    }
  };

  const toggleCredentialSelection = (credentialId: string) => {
    setUserForm((prev) => {
      const has = prev.credentialIds.includes(credentialId);
      const nextIds = has ? prev.credentialIds.filter((id) => id !== credentialId) : [...prev.credentialIds, credentialId];
      return { ...prev, credentialIds: nextIds };
    });
  };

  const viewToggle = !isAdmin
    ? null
    : (
    <div className="flex justify-end px-6 pt-4 mb-4">
      <div className="inline-flex overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <button
          onClick={() => setActivePage('credentials')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activePage === 'credentials' ? 'bg-primary/30 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Kayıtlar
        </button>
        <button
          onClick={() => isAdmin && setActivePage('users')}
          disabled={!isAdmin}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activePage === 'users' ? 'bg-primary/30 text-white' : 'text-slate-300 hover:text-white'
          } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Kullanıcı Yönetimi
        </button>
      </div>
    </div>
  );

  const renderUserManagement = () => {
    if (!isAdmin) {
      return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0c0c12] via-[#111115] to-[#09090c] scrollbar">
          {viewToggle}
          <div className="mx-auto max-w-4xl px-6 pb-16">
            <div className="mt-6 rounded-3xl border border-white/5 bg-white/5 p-8 text-center text-slate-300">
              <h2 className="text-2xl font-semibold text-white">Erişim yok</h2>
              <p className="mt-2">Kullanıcı yönetimi sadece admin rolü için erişilebilir.</p>
              <button
                className="mt-4 btn btn-primary"
                onClick={() => setActivePage('credentials')}
              >
                Kayıtlar sayfasına dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0c0c12] via-[#111115] to-[#09090c] scrollbar">
        {viewToggle}
        <div className="mx-auto max-w-7xl px-6 pb-16 space-y-6">
          <div className="mt-4 rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary-light">Kullanıcı Yönetimi</p>
                <h1 className="mt-1 text-3xl font-bold text-white">Kullanıcılar ve Erişimler</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  Yeni kullanıcı oluştur, rollerini güncelle ve hangi credentiallara erişebileceklerini belirle.
                </p>
              </div>
              <Tag tone="primary">{managedUsers.length} kullanıcı</Tag>
            </div>
            {error ? (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <HiOutlineUserGroup /> Kullanıcılar
                  </h3>
                  <p className="text-xs text-slate-400">Listele, seç veya sil.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setUserForm({ ...initialUserForm })}>
                  <HiOutlineUserAdd /> Yeni
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-white/5 bg-white/5">
                {usersLoading ? (
                  <div className="p-4 text-center text-slate-300">Yükleniyor...</div>
                ) : managedUsers.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Henüz kullanıcı yok.</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3">E-Posta</th>
                        <th className="px-4 py-3">Rol</th>
                        <th className="px-4 py-3">Yetki</th>
                        <th className="px-4 py-3 text-right">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {managedUsers.map((u) => {
                        const active = u.id === userForm.id;
                        return (
                          <tr key={u.id} className={active ? 'bg-primary/5 text-white' : 'text-slate-200'}>
                            <td className="px-4 py-3">
                              <div className="font-semibold">{u.email}</div>
                            </td>
                            <td className="px-4 py-3">{u.role}</td>
                            <td className="px-4 py-3 text-xs text-slate-300">{u.credentialIds.length} kayıt</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:border-primary/50"
                                  onClick={() => handleSelectManagedUser(u.id)}
                                  title="Seç"
                                >
                                  <HiOutlineUserCircle className="text-lg" />
                                </button>
                                <button
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-white/5 text-red-200 hover:text-white hover:border-red-500/60 hover:bg-red-500/10"
                                  onClick={() => handleDeleteManagedUser(u.id)}
                                  title="Sil"
                                >
                                  <HiOutlineTrash className="text-lg" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <HiOutlineShieldCheck /> Kullanıcı Detayı
                  </h3>
                  <p className="text-xs text-slate-400">Bilgileri güncelle ve erişimleri ata.</p>
                </div>
                {userForm.id ? (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary-light">Düzenleme</span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">Yeni Kayıt</span>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-slate-400">E-Posta</label>
                  <input
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    value={userForm.email}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-slate-400">Rol</label>
                  <input
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    value={userForm.role}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-slate-400">Parola {userForm.id ? '(boş bırakılırsa değişmez)' : ''}</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    value={userForm.password}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={userForm.id ? '••••••••' : ''}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={() => setUserForm({ ...initialUserForm })}>
                  Temizle
                </button>
                <button className="btn btn-primary" onClick={handleUserSave}>
                  Kaydet
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">Credential erişimleri</p>
                    <p className="text-xs text-slate-400">Kullanıcının erişebileceği kayıtları seçin.</p>
                  </div>
                  <span className="text-xs text-slate-300">{userForm.credentialIds.length} seçili</span>
                </div>
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1 scrollbar">
                  {accessCredentials.length === 0 ? (
                    <p className="text-sm text-slate-400">Henüz credential yok.</p>
                  ) : (
                    accessCredentials.map((cred) => {
                      const checked = userForm.credentialIds.includes(cred.id);
                      return (
                        <label
                          key={cred.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-primary/40"
                        >
                          <div>
                            <p className="font-semibold text-white">{cred.name}</p>
                            <p className="text-xs text-slate-400">{cred.hostOrUrl ?? cred.username ?? cred.appName ?? ''}</p>
                          </div>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={checked}
                            onChange={(e) => toggleCredentialSelection(cred.id)}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="btn btn-primary" onClick={handleUserAccessSave} disabled={!userForm.id}>
                    Erişimleri Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-925 text-slate-200">
        <div className="animate-pulse rounded-2xl bg-white/5 px-6 py-4 text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-925 text-white">
      {activePage === 'credentials' ? (
        <div className="hidden h-full w-72 flex-shrink-0 lg:block">
          <Sidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={(id) => setSelectedCategoryId(id)}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onSearch={setSearchTerm} />

        {activePage === 'credentials' ? (
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0c0c12] via-[#111115] to-[#09090c] scrollbar">
            {viewToggle}
            <header className="relative overflow-hidden border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary to-primary-light opacity-20 blur-3xl" />
              <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-6">
                <div className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-primary-light">Norax Security Stack</p>
                      <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">Norax Credentials</h1>
                      <p className="mt-2 max-w-3xl text-sm text-slate-300">
                        Tüm sunucu/RDP, bağlantı stringi ve üçüncü parti hesaplarınızı tek yerde yönetin. AES şifreleme,
                        JWT/ApiKey koruması ve modern kırmızı tema ile güvenli erişim panosu.
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Tag tone="primary">Kırmızı Tema</Tag>
                      <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-300">
                        Güvenlik katmanı: <span className="font-semibold text-primary-light">AES + JWT + ApiKey</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <StatCard title="Kategori" value={stats.totalCategories} icon={<HiOutlineShieldCheck size={22} />} />
                    <StatCard title="Kayıt" value={stats.totalCredentials} icon={<HiOutlineCloud size={22} />} />
                    <StatCard title="Son Güncelleme" value={stats.lastUpdated} icon={<HiOutlineUserGroup size={22} />} />
                  </div>
                  {error ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 pb-16 space-y-12">
              <div className="grid grid-cols-12 gap-6 mt-8">
                <div className="col-span-12 space-y-6 lg:col-span-12 order-2 lg:order-1">
                  <div className="surface-strong overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">Kayıtlar</h4>
                        <p className="text-xs text-slate-400">Parolalar ve connection stringler çözümlenmiş olarak gösterilir.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Tag tone="muted">{filteredCredentials.length} kayıt</Tag>
                        <button
                          disabled={!selectedCategoryId}
                          onClick={() => {
                            if (!selectedCategoryId) return;
                            setEditingCredential({
                              id: '',
                              categoryId: selectedCategoryId,
                              name: '',
                              hostOrUrl: '',
                              username: '',
                              password: '',
                              connectionString: '',
                              notes: '',
                              appName: '',
                              appLink: '',
                              accountFirstName: '',
                              accountLastName: '',
                              accountEmail: '',
                              accountRole: '',
                              serverVpnRequired: false,
                              createdAtUtc: new Date().toISOString(),
                              updatedAtUtc: new Date().toISOString(),
                            });
                            setModalOpen(true);
                          }}
                          className="btn btn-primary disabled:opacity-50"
                        >
                          <HiOutlinePlus /> Yeni kayıt
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                            {isInternalCategory ? (
                              <>
                                <th className="px-4 py-3">Uygulama</th>
                                <th className="px-4 py-3">Link</th>
                                <th className="px-4 py-3">E-Posta</th>
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3">Şifre</th>
                                <th className="px-4 py-3">Güncel</th>
                                <th className="px-4 py-3 text-right">Aksiyon</th>
                              </>
                            ) : isServerCategory ? (
                              <>
                                <th className="px-4 py-3">Sunucu</th>
                                <th className="px-4 py-3">HOST / URL</th>
                                <th className="px-4 py-3">Kullanıcı</th>
                                <th className="px-4 py-3">Şifre</th>
                                <th className="px-4 py-3">VPN</th>
                                <th className="px-4 py-3">Notlar</th>
                                <th className="px-4 py-3">Güncel</th>
                                <th className="px-4 py-3 text-right">Aksiyon</th>
                              </>
                            ) : isExternalCategory ? (
                              <>
                                <th className="px-4 py-3">Ad</th>
                                <th className="px-4 py-3">Sağlayıcı</th>
                                <th className="px-4 py-3">URL</th>
                                <th className="px-4 py-3">Kullanıcı / E-Posta</th>
                                <th className="px-4 py-3">Şifre</th>
                                <th className="px-4 py-3">API Key</th>
                                <th className="px-4 py-3">Notlar</th>
                                <th className="px-4 py-3">Güncel</th>
                                <th className="px-4 py-3 text-right">Aksiyon</th>
                              </>
                            ) : (
                              <>
                                <th className="px-4 py-3">Ad</th>
                                <th className="px-4 py-3">Host</th>
                                <th className="px-4 py-3">Kullanıcı</th>
                                <th className="px-4 py-3">Parola</th>
                                <th className="px-4 py-3">Conn. string</th>
                                <th className="px-4 py-3">Güncel</th>
                                <th className="px-4 py-3 text-right">Aksiyon</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                        {filteredCredentials.map((cred, idx) => {
                          const canReveal = cred.canViewSecret !== false;
                          const revealed = canReveal && revealedId === cred.id;
                          const hiddenLabel = '********';
                          const toggleReveal = () => {
                            if (!canReveal) return;
                            setRevealedId((prev) => (prev === cred.id ? null : cred.id));
                          };
                          const revealButtonClass = `flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:border-primary/50 ${!canReveal ? 'opacity-50 cursor-not-allowed' : ''}`;
                          const revealButtonTitle = !canReveal ? 'Yetki yok' : revealed ? 'Gizle' : 'Göster';

                          return (
                          <tr
                            key={cred.id}
                            className={`text-sm text-slate-200 ${idx % 2 === 0 ? 'bg-white/2' : 'bg-white/[0.03]'}`}
                          >
                            {isInternalCategory ? (
                              <>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{cred.appName || cred.name}</div>
                                  <p className="text-xs text-slate-400">{cred.accountFirstName} {cred.accountLastName}</p>
                                </td>
                                <td className="px-4 py-3 max-w-[200px] text-xs text-slate-300 break-all">
                                  {revealed ? cred.appLink ?? '—' : hiddenLabel}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-200">
                                  {revealed ? cred.accountEmail ?? '—' : hiddenLabel}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-200">
                                  {revealed ? cred.accountRole ?? '—' : hiddenLabel}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-100">
                                  {cred.password ? (
                                    <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] text-primary-light">
                                      {revealed ? cred.password : hiddenLabel}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">
                                  {new Date(cred.updatedAtUtc).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className={revealButtonClass}
                                      title={revealButtonTitle}
                                      disabled={!canReveal}
                                      onClick={toggleReveal}
                                    >
                                      {revealed ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:border-primary/50 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        setEditingCredential(cred);
                                        setModalOpen(true);
                                      }}
                                      title="Düzenle"
                                    >
                                      <HiOutlinePencil className="text-lg" />
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-white/5 text-red-200 hover:text-white hover:border-red-500/60 hover:bg-red-500/10 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        handleDeleteCredential(cred.id);
                                      }}
                                      title="Sil"
                                    >
                                      <HiOutlineTrash className="text-lg" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : isServerCategory ? (
                              <>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{cred.name}</div>
                                  <p className="text-xs text-slate-400">{revealed ? cred.notes : hiddenLabel}</p>
                                </td>
                                <td className="px-4 py-3">{revealed ? cred.hostOrUrl : hiddenLabel}</td>
                                <td className="px-4 py-3">{revealed ? cred.username : hiddenLabel}</td>
                                <td className="px-4 py-3 text-xs text-slate-100">
                                  {cred.password ? (
                                    <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] text-primary-light">
                                      {revealed ? cred.password : hiddenLabel}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-200">
                                  {revealed
                                    ? cred.serverVpnRequired
                                      ? 'Evet'
                                      : 'Hayır'
                                    : hiddenLabel}
                                </td>
                                <td className="px-4 py-3 max-w-[200px] text-xs text-slate-300 break-all">
                                  {revealed ? cred.notes ?? '—' : hiddenLabel}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">
                                  {new Date(cred.updatedAtUtc).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className={revealButtonClass}
                                      title={revealButtonTitle}
                                      disabled={!canReveal}
                                      onClick={toggleReveal}
                                    >
                                      {revealed ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:border-primary/50 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        setEditingCredential(cred);
                                        setModalOpen(true);
                                      }}
                                      title="Düzenle"
                                    >
                                      <HiOutlinePencil className="text-lg" />
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-white/5 text-red-200 hover:text-white hover:border-red-500/60 hover:bg-red-500/10 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        handleDeleteCredential(cred.id);
                                      }}
                                      title="Sil"
                                    >
                                      <HiOutlineTrash className="text-lg" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : isExternalCategory ? (
                              <>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{cred.name}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-200">{cred.appName || '—'}</td>
                                <td className="px-4 py-3 max-w-[200px] text-xs text-slate-300 break-all">
                                  {revealed ? cred.hostOrUrl ?? '—' : hiddenLabel}
                                </td>
                                <td className="px-4 py-3">{revealed ? cred.username ?? '—' : hiddenLabel}</td>
                                <td className="px-4 py-3 text-xs text-slate-100">
                                  {cred.password ? (
                                    <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] text-primary-light">
                                      {revealed ? cred.password : hiddenLabel}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 max-w-[240px] text-xs text-slate-200">
                                  <div className="break-all">
                                    {revealed ? cred.connectionString ?? '—' : hiddenLabel}
                                  </div>
                                </td>
                                <td className="px-4 py-3 max-w-[200px] text-xs text-slate-300 break-all">
                                  {revealed ? cred.notes ?? '—' : hiddenLabel}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">
                                  {new Date(cred.updatedAtUtc).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className={revealButtonClass}
                                      title={revealButtonTitle}
                                      disabled={!canReveal}
                                      onClick={toggleReveal}
                                    >
                                      {revealed ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:border-primary/50 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        setEditingCredential(cred);
                                        setModalOpen(true);
                                      }}
                                      title="Düzenle"
                                    >
                                      <HiOutlinePencil className="text-lg" />
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-white/5 text-red-200 hover:text-white hover:border-red-500/60 hover:bg-red-500/10 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        handleDeleteCredential(cred.id);
                                      }}
                                      title="Sil"
                                    >
                                      <HiOutlineTrash className="text-lg" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white">{cred.name}</div>
                                  <p className="text-xs text-slate-400">{cred.notes}</p>
                                </td>
                                <td className="px-4 py-3">{revealed ? cred.hostOrUrl : hiddenLabel}</td>
                                <td className="px-4 py-3">{revealed ? cred.username : hiddenLabel}</td>
                                <td className="px-4 py-3 text-xs text-slate-100">
                                  {cred.password ? (
                                    <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] text-primary-light">
                                      {revealed ? cred.password : hiddenLabel}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 max-w-[260px] text-xs text-slate-200">
                                  <div className="break-all" title={cred.connectionString ?? ''}>
                                    {revealed ? cred.connectionString ?? '—' : hiddenLabel}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">
                                  {new Date(cred.updatedAtUtc).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className={revealButtonClass}
                                      title={revealButtonTitle}
                                      disabled={!canReveal}
                                      onClick={toggleReveal}
                                    >
                                      {revealed ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:border-primary/50 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        setEditingCredential(cred);
                                        setModalOpen(true);
                                      }}
                                      title="Düzenle"
                                    >
                                      <HiOutlinePencil className="text-lg" />
                                    </button>
                                    <button
                                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-white/5 text-red-200 hover:text-white hover:border-red-500/60 hover:bg-red-500/10 ${!isAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      disabled={!isAdmin}
                                      onClick={() => {
                                        if (!isAdmin) return;
                                        handleDeleteCredential(cred.id);
                                      }}
                                      title="Sil"
                                    >
                                      <HiOutlineTrash className="text-lg" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                        })}
                        {filteredCredentials.length === 0 ? (
                          <tr>
                            <td
                              colSpan={isInternalCategory ? 7 : isServerCategory ? 8 : isExternalCategory ? 9 : 7}
                              className="px-4 py-6 text-center text-slate-400"
                            >
                              Henüz kayıt yok. Sağ üstteki <span className="font-semibold text-primary">Yeni Kayıt</span> butonunu kullanın.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      ) : (
        renderUserManagement()
      )}
      </div>
      <Modal
        open={modalOpen && editingCredential !== null}
        title={editingCredential?.id ? 'Kayıt Düzenle' : 'Yeni Kayıt'}
        onClose={() => {
          setModalOpen(false);
          setEditingCredential(null);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setModalOpen(false);
                setEditingCredential(null);
              }}
            >
              Vazgeç
            </button>
            <button className="btn btn-primary" onClick={handleModalSave}>
              Kaydet
            </button>
          </div>
        }
      >
        {editingCredential ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {isInternalCategory ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Uygulama Adı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.appName ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, appName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Uygulama Linki</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.appLink ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, appLink: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Hesap Adı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.accountFirstName ?? ''}
                      onChange={(e) =>
                        setEditingCredential((prev) => prev && { ...prev, accountFirstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Hesap Soyadı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.accountLastName ?? ''}
                      onChange={(e) =>
                        setEditingCredential((prev) => prev && { ...prev, accountLastName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Hesap E-Posta</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.accountEmail ?? ''}
                      onChange={(e) =>
                        setEditingCredential((prev) => prev && { ...prev, accountEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Hesap Rolü</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.accountRole ?? ''}
                      onChange={(e) =>
                        setEditingCredential((prev) => prev && { ...prev, accountRole: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Hesap Şifresi</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.password ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Notlar</label>
                    <textarea
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      rows={2}
                      value={editingCredential.notes ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, notes: e.target.value })}
                    />
                  </div>
                </>
              ) : isServerCategory ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Sunucu Adı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.name}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">HOST / URL</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.hostOrUrl ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, hostOrUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Kullanıcı Adı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.username ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Kullanıcı Şifresi</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.password ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">VPN Gerekli mi?</label>
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={!!editingCredential.serverVpnRequired}
                        onChange={(e) =>
                          setEditingCredential((prev) => prev && { ...prev, serverVpnRequired: e.target.checked })
                        }
                      />
                      <span className="text-sm text-white/80">VPN bağlantısı gerekiyor</span>
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Notlar</label>
                    <textarea
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      rows={2}
                      value={editingCredential.notes ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, notes: e.target.value })}
                    />
                  </div>
                </>
              ) : isExternalCategory ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Ad</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.name}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Sağlayıcı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.appName ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, appName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">URL</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.hostOrUrl ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, hostOrUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Kullanıcı Adı / E-Posta</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.username ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Şifre</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.password ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">API Key (Opsiyonel)</label>
                    <textarea
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      rows={2}
                      value={editingCredential.connectionString ?? ''}
                      onChange={(e) =>
                        setEditingCredential((prev) => prev && { ...prev, connectionString: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Notlar</label>
                    <textarea
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      rows={2}
                      value={editingCredential.notes ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, notes: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Ad</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.name}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Host / URL</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.hostOrUrl ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, hostOrUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Kullanıcı adı</label>
                    <input
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.username ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Parola</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      value={editingCredential.password ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Connection string</label>
                    <textarea
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      rows={2}
                      value={editingCredential.connectionString ?? ''}
                      onChange={(e) =>
                        setEditingCredential((prev) => prev && { ...prev, connectionString: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase tracking-wide text-slate-400">Notlar</label>
                    <textarea
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                      rows={2}
                      value={editingCredential.notes ?? ''}
                      onChange={(e) => setEditingCredential((prev) => prev && { ...prev, notes: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default App;
