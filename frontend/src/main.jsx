import { apiRequest } from './services/http.js';
import { buildIncidentQuery } from './services/incident-query.js';
import LoginPage from './components/LoginPage.jsx';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, ArrowLeft } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import './style.css';
import { API } from './services/api.js';
function App() {
    const [token, setToken] = useState(localStorage.getItem('hub_token') || '');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('hub_user') || 'null'));
    const [page, setPage] = useState('Inicio');
    const [incidents, setIncidents] = useState([]);
    const [filteredIncidents, setFilteredIncidents] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState({ statuses: [], categories: [] });
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [techFilter, setTechFilter] = useState('');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [login, setLogin] = useState({ email: 'admin@demo.local', password: '' });
    const [form, setForm] = useState({ title: '', description: '', category_id: '', priority: 'MEDIA' });
    const [comment, setComment] = useState('');
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });
    const [newCategory, setNewCategory] = useState('');
    const request = (path, opts = {}) => apiRequest(path, token, opts);
    async function refresh() { try {
        const [i, c, d] = await Promise.all([request('/incidents'), request('/categories'), request('/dashboard')]);
        const u = user?.role === 'USER' ? [] : await request('/users');
        setIncidents(i);
        setUsers(u);
        setCategories(c);
        setSummary(d);
    }
    catch (e) {
        setError(e.message);
    } }
    useEffect(() => { if (token)
        refresh(); }, [token]);
    useEffect(() => {
        if (!token || (page !== 'Incidentes' && page !== 'Mis asignaciones')) return;

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            const technician = page === 'Mis asignaciones' ? user?.id : techFilter;
            const query = buildIncidentQuery({
                status: filter,
                priority: priorityFilter,
                category: categoryFilter,
                technician,
                q: search,
            });

            try {
                const path = query ? '/incidents?' + query : '/incidents';
                const rows = await request(path, { signal: controller.signal });
                setFilteredIncidents(rows);
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            }
        }, 250);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [token, page, filter, priorityFilter, categoryFilter, techFilter, search, user?.id, incidents]);

    async function signIn(e) { e.preventDefault(); setError(''); try {
        const r = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(login) });
        const d = await r.json();
        if (!r.ok)
            throw Error(d.error);
        localStorage.setItem('hub_token', d.token);
        localStorage.setItem('hub_user', JSON.stringify(d.user));
        setToken(d.token);
        setUser(d.user);
    }
    catch (e) {
        setError(e.message);
    } }
    function logout() { localStorage.removeItem('hub_token'); localStorage.removeItem('hub_user'); setToken(''); setUser(null); }
    async function save(path, method, body, done) { setError(''); try {
        await request(path, { method, body: JSON.stringify(body) });
        await refresh();
        if (done)
            await done();
    }
    catch (e) {
        setError(e.message);
    } }
    async function openIncident(id) { try {
        setSelected(await request('/incidents/' + id));
        setPage('Detalle');
    }
    catch (e) {
        setError(e.message);
    } }
    async function updateIncident(body) { await save('/incidents/' + selected.id, 'PATCH', body, () => openIncident(selected.id)); }
    const count = (status) => summary.statuses.find(x => x.status === status)?.count || 0;
    if (!token)
        return <LoginPage login={login} setLogin={setLogin} signIn={signIn} error={error}/>;
    const tabs = ['Inicio', 'Incidentes', 'Mis asignaciones', ...(user?.role === 'ADMIN' ? ['Usuarios', 'Categorías'] : [])];
    const shown = filteredIncidents;
    return <div className="app"><Sidebar tabs={tabs} page={page} user={user} setPage={setPage} setSelected={setSelected} setError={setError} logout={logout}/><main><header className="top"><span>Centro de soporte / {page}</span><span className="avatar">{user?.name?.slice(0, 1)}</span></header><div className="content">{error && <div className="error banner" onClick={() => setError('')}>{error} ×</div>}
    {page === 'Inicio' && <DashboardPage incidents={incidents} summary={summary} count={count} setPage={setPage} openIncident={openIncident}/>}
    {(page === 'Incidentes' || page === 'Mis asignaciones') && <IncidentsPage page={page} setPage={setPage} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} techFilter={techFilter} setTechFilter={setTechFilter} users={users} categories={categories} shown={shown} openIncident={openIncident}/>}
    {page === 'Nuevo incidente' && <><div className="page-head"><div><span className="eyebrow">Solicitudes</span><h1>Nuevo incidente</h1><p>Describe el problema para iniciar el seguimiento.</p></div></div><form className="panel form" onSubmit={e => { e.preventDefault(); save('/incidents', 'POST', form, () => { setPage('Incidentes'); setForm({ title: '', description: '', category_id: '', priority: 'MEDIA' }); }); }}><label>Título<input required maxLength="180" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><label>Descripción<textarea required rows="5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label><div className="two"><label>Categoría<select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">Seleccionar</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Prioridad<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map(x => <option key={x}>{x}</option>)}</select></label></div><button className="primary">Registrar incidente</button></form></>}
    {page === 'Detalle' && selected && <><button className="link back" onClick={() => setPage('Incidentes')}><ArrowLeft size={16}/> Volver a incidentes</button><div className="page-head"><div><span className="eyebrow">INC-{String(selected.id).padStart(3, '0')} · {selected.category}</span><h1>{selected.title}</h1><p>Registrado por {selected.reporter} · {new Date(selected.created_at).toLocaleDateString('es-GT')}</p></div><span className="pill">{selected.status.replaceAll('_', ' ')}</span></div><div className="detail-grid"><section className="panel"><h2>Descripción</h2><p className="description">{selected.description}</p><h2>Historial y comentarios</h2><div className="timeline">{selected.history?.map(h => <div className="event" key={h.id}><b>{h.author} · {h.action}</b><small>{new Date(h.created_at).toLocaleString('es-GT')}</small><p>{h.detail}</p></div>)}</div><form onSubmit={e => { e.preventDefault(); save('/incidents/' + selected.id + '/comments', 'POST', { detail: comment }, () => { setComment(''); return openIncident(selected.id); }); }}><label>Agregar comentario<textarea rows="3" value={comment} onChange={e => setComment(e.target.value)} required/></label><button className="primary">Publicar comentario</button></form></section><section className="panel"><h2>Información</h2><div className="metric"><span>Prioridad</span><b>{selected.priority}</b></div><div className="metric"><span>Técnico</span><b>{selected.technician || 'Sin asignar'}</b></div>{user.role !== 'USER' && <><label>Estado<select value={selected.status} onChange={e => updateIncident({ status: e.target.value })}>{['NUEVO', 'ASIGNADO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'].map(s => <option key={s}>{s}</option>)}</select></label>{user.role === 'ADMIN' && <label>Asignar técnico<select value={selected.technician_id || ''} onChange={e => updateIncident({ technician_id: e.target.value ? Number(e.target.value) : null })}><option value="">Sin asignar</option>{users.filter(u => u.role === 'TECH' || u.role === 'ADMIN').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}</>}</section></div></>}
    {page === 'Usuarios' && user.role === 'ADMIN' && <><div className="page-head"><div><span className="eyebrow">Administración</span><h1>Usuarios</h1></div></div><section className="panel"><h2>Usuarios registrados</h2>{users.map(u => <div className="metric" key={u.id}><span>{u.name} · {u.email}</span><b>{u.role}</b></div>)}</section><form className="panel form" onSubmit={e => { e.preventDefault(); save('/users', 'POST', newUser, () => setNewUser({ name: '', email: '', password: '', role: 'USER' })); }}><h2>Agregar usuario</h2>{['name', 'email', 'password'].map(k => <label key={k}>{({ name: 'Nombre', email: 'Correo', password: 'Contraseña (mín. 8)' })[k]}<input required type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'} value={newUser[k]} onChange={e => setNewUser({ ...newUser, [k]: e.target.value })}/></label>)}<label>Rol<select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>{['USER', 'TECH', 'ADMIN'].map(r => <option key={r}>{r}</option>)}</select></label><button className="primary">Crear usuario</button></form></>}
    {page === 'Categorías' && user.role === 'ADMIN' && <><div className="page-head"><div><span className="eyebrow">Administración</span><h1>Categorías</h1></div></div><section className="panel">{categories.map(c => <div className="metric" key={c.id}><span>{c.name}</span><b>#{c.id}</b></div>)}</section><form className="panel form" onSubmit={e => { e.preventDefault(); save('/categories', 'POST', { name: newCategory }, () => setNewCategory('')); }}><label>Nueva categoría<input required value={newCategory} onChange={e => setNewCategory(e.target.value)}/></label><button className="primary">Agregar</button></form></>}
    </div></main></div>;
}
createRoot(document.getElementById('root')).render(<App />);
