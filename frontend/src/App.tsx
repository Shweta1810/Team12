import { FormEvent, useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
type User = { id: string; name: string; email: string; role: 'Admin' | 'Sales Staff' | 'Support Staff'; isActive?: boolean };
type ListedUser = User & { createdAt?: string };
type ApiResponse = { message?: string; user?: User; users?: ListedUser[]; token?: string };

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('crm_token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(() => Boolean(sessionStorage.getItem('crm_token')));
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<User['role']>('Sales Staff');
  const [notice, setNotice] = useState('');

  async function api(path: string, options: RequestInit = {}): Promise<ApiResponse> {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    let data: ApiResponse;
    try {
      const body: unknown = await res.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
      data = body as ApiResponse;
    } catch {
      throw new Error('The server returned an unreadable response');
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  useEffect(() => {
    if (!token) { setUser(null); setCheckingSession(false); return; }
    let active = true;
    setCheckingSession(true);
    api('/api/auth/me').then((d) => {
      if (active && d.user) setUser(d.user);
    }).catch(() => {
      if (!active) return;
      sessionStorage.removeItem('crm_token');
      setToken('');
      setUser(null);
      setError('Your session is invalid or expired. Please sign in again.');
    }).finally(() => {
      if (active) setCheckingSession(false);
    });
    return () => { active = false; };
    // The token is the session key; api uses the matching token from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (user?.role !== 'Admin') { setUsers([]); return; }
    let active = true;
    setLoadingUsers(true);
    api('/api/users').then(d => {
      if (active) setUsers(d.users || []);
    }).catch(e => {
      if (active) setError(e instanceof Error ? e.message : 'Could not load accounts');
    }).finally(() => {
      if (active) setLoadingUsers(false);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const d = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
      if (!d.token || !d.user) throw new Error('The server returned an incomplete login response');
      sessionStorage.setItem('crm_token', d.token); setToken(d.token); setUser(d.user); setPassword('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Login failed'); }
    finally { setBusy(false); }
  }

  async function logout() {
    let serverLogoutFailed = false;
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { serverLogoutFailed = true; }
    sessionStorage.removeItem('crm_token'); setToken(''); setUser(null); setUsers([]); setNotice('You have logged out.');
    if (serverLogoutFailed) setError('Signed out in this browser, but the server could not invalidate the token. It remains valid until it expires.');
  }

  async function createUser(e: FormEvent) {
    e.preventDefault(); setError(''); setNotice('');
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }) });
      setNotice('User created successfully.'); setNewName(''); setNewEmail(''); setNewPassword('');
      const d = await api('/api/users'); setUsers(d.users || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create user'); }
  }

  async function updateUser(id: string, changes: Partial<ListedUser>) {
    setError(''); setNotice('');
    try {
      await api(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      const d = await api('/api/users'); setUsers(d.users || []); setNotice('Account updated.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update user'); }
  }

  if (checkingSession) return <main className="shell"><section className="panel login" aria-live="polite"><p className="muted">Checking your session…</p></section></main>;

  if (!user) return <main className="shell"><section className="panel login">
    <p className="eyebrow">TEAM12 · CUSTOMER RELATIONSHIP MANAGEMENT</p><h1>Welcome back</h1>
    <p className="muted">Sign in with your staff account.</p>
    <form onSubmit={login}>
      <label>Email<input type="email" autoComplete="username" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p className="alert" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
      <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="small muted">Accounts are provisioned by an administrator. Self-registration is disabled.</p>
  </section></main>;

  return <main className="shell">
    <header className="topbar"><div><p className="eyebrow">TEAM12 CRM</p><h1>Dashboard</h1></div><div className="profile"><span>{user.name}<small>{user.role}</small></span><button className="secondary" onClick={logout}>Log out</button></div></header>
    {error && <p className="alert" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
    <section className="panel welcome"><div><p className="eyebrow">SIGNED IN</p><h2>Hello, {user.name}</h2><p className="muted">Your role controls which CRM features you can access.</p></div><span className="role">{user.role}</span></section>
    {user.role === 'Admin' ? <section className="panel">
      <h2>Staff account management</h2><p className="muted">Create accounts, change roles, and deactivate staff. Only administrators can access this screen.</p>
      <form className="create-form" onSubmit={createUser}>
        <label>Name<input required minLength={2} maxLength={100} value={newName} onChange={e => setNewName(e.target.value)} /></label>
        <label>Email<input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></label>
        <label>Temporary password<input required type="password" minLength={12} maxLength={72} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
        <label>Role<select value={newRole} onChange={e => setNewRole(e.target.value as User['role'])}><option>Sales Staff</option><option>Support Staff</option><option>Admin</option></select></label>
        <button>Create account</button>
      </form>
      <h3>Existing accounts</h3><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><select aria-label={`Role for ${u.email}`} value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as User['role'] })}><option>Admin</option><option>Sales Staff</option><option>Support Staff</option></select></td><td>{u.isActive ? 'Active' : 'Inactive'}</td><td><button className="secondary" disabled={u.id === user.id} onClick={() => updateUser(u.id, { isActive: !u.isActive })}>{u.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
      {loadingUsers ? <tr><td colSpan={5}>Loading accounts…</td></tr> : users.length === 0 && <tr><td colSpan={5}>No staff accounts found.</td></tr>}
      </tbody></table></div>
    </section> : <section className="panel"><h2>Your workspace</h2><p className="muted">{user.role === 'Sales Staff' ? 'Sales staff can work with assigned leads, customer records, conversions and follow-ups as enabled by the CRM API.' : 'Support staff can work with customer history, interactions, feedback, follow-ups and retention as enabled by the CRM API.'}</p><p className="small muted">Other CRM modules will appear as the team implements them.</p></section>}
    <p className="footer">CRM academic prototype · Keep your credentials private.</p>
  </main>;
}
