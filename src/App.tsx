import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Download, Eye, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Plus, Search, Trash2, Upload, Users, X } from 'lucide-react'
import { api, downloadDocument, fetchDocumentBlob, login, logout, restoreSession, type Appointment, type Client, type Document, type User } from './api'

const fullName = (client: Client) => `${client.first_name} ${client.last_name}`
const dateText = (value: string) => new Intl.DateTimeFormat('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
const timeText = (value: string) => new Intl.DateTimeFormat('sq-AL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const initials = (client: Client) => `${client.first_name[0] || ''}${client.last_name[0] || ''}`.toUpperCase()

function AppRoutes() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => { restoreSession().then(async ok => {
    if (ok) { try { setUser(await api<User>('/auth/me')) } catch { setUser(null) } }
  }).finally(() => setReady(true)) }, [])
  if (!ready) return <div className="splash"><span className="brand-mark">K<span>.</span></span><p>Duke hapur Konsultime…</p></div>
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={async () => setUser(await api<User>('/auth/me'))} />} />
    <Route path="/*" element={user ? <Shell user={user} onLogout={async () => { await logout(); setUser(null) }} /> : <Navigate to="/login" replace />} />
  </Routes>
}

function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { await login(username, password); await onLogin() } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return <div className="login-page"><div className="login-art"><div className="login-art-top"><span className="brand-mark">K<span>.</span></span><span>KONSULTIME</span></div><div className="art-copy"><div className="art-kicker">PUNA JUA, MË QARTË</div><h1>Gjithçka<br/>në vendin<br/><em>e duhur.</em></h1><p>Klientët, dokumentet dhe terminet tuaja, të organizuara për çdo ditë.</p></div><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-foot">Një hapësirë e qetë për punën tuaj.</div></div><div className="login-panel"><div className="login-mobile-brand"><span className="brand-mark">K<span>.</span></span> KONSULTIME</div><form onSubmit={submit} className="login-form"><span className="eyebrow">MIRË SE U KTHYET</span><h2>Hyni në llogari</h2><p>Vazhdoni aty ku e latë punën.</p><label>Emri i përdoruesit<input autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="Shkruani emrin" /></label><label>Fjalëkalimi<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Shkruani fjalëkalimin" /></label>{error && <div className="error" role="alert">{error}</div>}<button className="button primary wide" disabled={busy}>{busy ? 'Duke hyrë…' : 'Hyr në Konsultime'} <ArrowRight size={18}/></button></form><div className="login-footer">© {new Date().getFullYear()} Konsultime</div></div></div>
}

function Shell({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()
  const nav = [{ to: '/', label: 'Përmbledhje', icon: LayoutDashboard, end: true }, { to: '/clients', label: 'Klientët', icon: Users, end: false }, { to: '/appointments', label: 'Terminet', icon: CalendarDays, end: false }]
  return <div className="app-shell"><aside className={`sidebar ${menu ? 'open' : ''}`}><div className="sidebar-head"><span className="brand-mark">K<span>.</span></span><span className="brand-name">KONSULTIME</span><button className="icon-button mobile-only" onClick={() => setMenu(false)} aria-label="Mbyll menynë"><X size={20}/></button></div><div className="sidebar-section">HAPËSIRA E PUNËS</div><nav>{nav.map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenu(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><item.icon size={19}/>{item.label}</NavLink>)}</nav><div className="sidebar-bottom"><div className="profile-avatar">{user.username.slice(0, 2).toUpperCase()}</div><div className="profile-info"><b>{user.username}</b><small>Llogaria ime</small></div><button className="icon-button" aria-label="Dil" title="Dil" onClick={async () => { await onLogout(); navigate('/login') }}><LogOut size={18}/></button></div></aside>{menu && <div className="menu-backdrop" onClick={() => setMenu(false)}/>}<div className="main-area"><header className="topbar"><button className="icon-button mobile-only" onClick={() => setMenu(true)} aria-label="Hap menynë"><Menu size={22}/></button><span className="topbar-label">Hapësira juaj e punës</span><span className="topbar-date">{dateText(new Date().toISOString())}</span></header><main><Routes><Route index element={<Dashboard />} /><Route path="clients" element={<Clients />} /><Route path="clients/:id" element={<ClientDetail />} /><Route path="appointments" element={<Appointments />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main></div><nav className="bottom-nav">{nav.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'active' : ''}><item.icon size={21}/><span>{item.label}</span></NavLink>)}</nav></div>
}

function useData<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { try { setData(await api<T>(path)); setError('') } catch (err) { setError((err as Error).message) } }, [path])
  useEffect(() => { load() }, [load])
  return { data, error, load }
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Dashboard() {
  const { data: clients, error: clientError } = useData<Client[]>('/clients')
  const { data: appointments, error: appointmentError } = useData<Appointment[]>('/appointments')
  const upcoming = (appointments || []).filter(item => new Date(item.starts_at).getTime() >= Date.now()).slice(0, 5)
  const today = (appointments || []).filter(item => new Date(item.starts_at).toDateString() === new Date().toDateString()).length
  return <><PageHeader eyebrow="PËRMBLEDHJE" title="Përshëndetje!" description="Ja çfarë keni në plan për sot." /><div className="hero-card"><div className="hero-content"><span className="hero-label"><span className="live-dot"/> DITA JUAJ NË NJË VËSHTRIM</span><h2>Organizuar për<br/>çdo takim.</h2><p>Mbani çdo klient dhe termin pranë vetes, në çdo moment.</p><div className="hero-actions"><NavLink className="button light" to="/appointments">Shiko terminet <ArrowRight size={17}/></NavLink></div></div><div className="hero-illustration"><div className="hero-ring ring-1"/><div className="hero-ring ring-2"/><div className="hero-calendar"><div className="calendar-top"><i/><i/></div><div className="calendar-grid">{Array.from({length: 9}, (_, i) => <span key={i} className={i === 4 ? 'selected' : ''}>{i + 9}</span>)}</div></div><div className="hero-check">✓</div></div></div><div className="stats-grid"><div className="stat-card"><div className="stat-icon mint"><Users size={22}/></div><div><span>Klientë gjithsej</span><strong>{clients?.length ?? '—'}</strong></div><NavLink to="/clients"><ArrowRight size={18}/></NavLink></div><div className="stat-card"><div className="stat-icon cream"><CalendarDays size={22}/></div><div><span>Termine sot</span><strong>{appointments ? today : '—'}</strong></div><NavLink to="/appointments"><ArrowRight size={18}/></NavLink></div><div className="stat-card"><div className="stat-icon lavender"><Clock3 size={22}/></div><div><span>Termine në vazhdim</span><strong>{appointments ? (appointments || []).filter(item => new Date(item.starts_at).getTime() >= Date.now()).length : '—'}</strong></div><NavLink to="/appointments"><ArrowRight size={18}/></NavLink></div></div><div className="section-heading"><div><span className="eyebrow">NË VIJIM</span><h2>Terminet e ardhshme</h2></div><NavLink to="/appointments" className="text-link">Të gjitha <ArrowRight size={16}/></NavLink></div>{clientError || appointmentError ? <div className="error">{clientError || appointmentError}</div> : upcoming.length ? <div className="appointment-list">{upcoming.map(item => <AppointmentRow key={item.id} appointment={item}/>)}</div> : <Empty icon={<CalendarDays size={28}/>} title="Nuk ka termine në vazhdim" text="Shtoni një termin për ta parë këtu." link="/appointments" linkText="Shto termin" />}</>
}

function Empty({ icon, title, text, link, linkText }: { icon: React.ReactNode; title: string; text: string; link?: string; linkText?: string }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{link && <NavLink className="button primary" to={link}>{linkText} <ArrowRight size={16}/></NavLink>}</div>
}

function AppointmentRow({ appointment, actions }: { appointment: Appointment; actions?: React.ReactNode }) {
  const date = new Date(appointment.starts_at)
  return <div className="appointment-row"><div className="date-block"><strong>{date.getDate()}</strong><span>{new Intl.DateTimeFormat('sq-AL', { month: 'short' }).format(date)}</span></div><div className="appointment-info"><strong>{fullName(appointment.client)}</strong><span><Clock3 size={14}/> {timeText(appointment.starts_at)} <i/> {dateText(appointment.starts_at)}</span>{appointment.notes && <small>{appointment.notes}</small>}</div>{actions}</div>
}

function Clients() {
  const { data: clients, error, load } = useData<Client[]>('/clients')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<Client | 'new' | null>(null)
  const filtered = (clients || []).filter(client => fullName(client).toLowerCase().includes(search.toLowerCase()) || client.phone.includes(search))
  return <><PageHeader eyebrow="DIREKTORIA" title="Klientët" description="Të dhënat dhe dokumentet e klientëve tuaj, në një vend." action={<button className="button primary" onClick={() => setModal('new')}><Plus size={18}/> Klient i ri</button>} /><div className="toolbar"><div className="search"><Search size={19}/><input placeholder="Kërko sipas emrit ose numrit…" value={search} onChange={e => setSearch(e.target.value)}/></div><span className="count">{filtered.length} klientë</span></div>{error && <div className="error">{error}</div>}{clients && !filtered.length ? <Empty icon={<Users size={28}/>} title={search ? 'Nuk u gjet asnjë klient' : 'Ende nuk ka klientë'} text={search ? 'Provoni një kërkim tjetër.' : 'Shtoni klientin tuaj të parë.'} /> : <div className="client-grid">{filtered.map(client => <NavLink to={`/clients/${client.id}`} key={client.id} className="client-card"><div className="client-avatar">{initials(client)}</div><div className="client-card-main"><h3>{fullName(client)}</h3><p>{client.phone}</p><span><FileText size={14}/> {client.documents.length} dokumente</span></div><ArrowRight className="client-arrow" size={19}/></NavLink>)}</div>}{modal && <ClientModal client={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load() }}/>}</>
}

function ClientModal({ client, onClose, onSaved }: { client?: Client; onClose: () => void; onSaved: () => Promise<void> }) {
  const [firstName, setFirstName] = useState(client?.first_name || '')
  const [lastName, setLastName] = useState(client?.last_name || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await api(`/clients${client ? `/${client.id}` : ''}`, { method: client ? 'PATCH' : 'POST', body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }) }); await onSaved() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <Modal title={client ? 'Ndrysho klientin' : 'Klient i ri'} onClose={onClose}><form className="form" onSubmit={submit}><div className="form-row"><label>Emri<input required maxLength={100} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Emri" /></label><label>Mbiemri<input required maxLength={100} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mbiemri" /></label></div><label>Numri i kontaktit<input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+389 ..." /></label>{error && <div className="error">{error}</div>}<div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Anulo</button><button disabled={busy} className="button primary">{busy ? 'Duke ruajtur…' : 'Ruaj klientin'}</button></div></form></Modal>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Mbyll"><X size={21}/></button></div>{children}</div></div>
}

function DocumentPreview({ clientId, initialDocument, documents, onClose }: {
  clientId: number; initialDocument: Document; documents: Document[]; onClose: () => void
}) {
  const [current, setCurrent] = useState(initialDocument)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const images = documents.filter(doc => doc.content_type.startsWith('image/'))
  const imageIndex = images.findIndex(doc => doc.id === current.id)
  const isImage = imageIndex !== -1

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    setUrl(null)
    setError('')
    fetchDocumentBlob(clientId, current).then(blob => {
      if (cancelled) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(err => { if (!cancelled) setError((err as Error).message) })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [clientId, current])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (isImage && event.key === 'ArrowLeft' && imageIndex > 0) setCurrent(images[imageIndex - 1])
      if (isImage && event.key === 'ArrowRight' && imageIndex < images.length - 1) setCurrent(images[imageIndex + 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isImage, imageIndex, images])

  return <div className="preview-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="preview-dialog" role="dialog" aria-modal="true" aria-label={`Shiko ${current.original_name}`}>
      <div className="preview-bar">
        <div className="preview-title"><span className="preview-file-icon">{isImage ? <ImageIcon size={19}/> : <FileText size={19}/>}</span><div><strong>{current.original_name}</strong><small>{isImage ? `Foto ${imageIndex + 1} nga ${images.length}` : 'Dokument PDF'}</small></div></div>
        <div className="preview-tools"><button className="preview-download" onClick={() => downloadDocument(clientId, current).catch(err => setError((err as Error).message))}><Download size={18}/><span>Shkarko</span></button><button className="preview-close" onClick={onClose} aria-label="Mbyll pamjen"><X size={22}/></button></div>
      </div>
      <div className={`preview-content ${isImage ? 'image-content' : 'pdf-content'}`}>
        {error ? <div className="preview-message" role="alert">{error}</div> : !url ? <div className="preview-message">Duke hapur dokumentin…</div> : isImage ? <img src={url} alt={current.original_name}/> : <iframe src={url} title={current.original_name}/>}
        {isImage && images.length > 1 && <><button className="preview-arrow previous" disabled={imageIndex === 0} onClick={() => setCurrent(images[imageIndex - 1])} aria-label="Fotoja e mëparshme"><ChevronLeft size={26}/></button><button className="preview-arrow next" disabled={imageIndex === images.length - 1} onClick={() => setCurrent(images[imageIndex + 1])} aria-label="Fotoja tjetër"><ChevronRight size={26}/></button></>}
      </div>
    </div>
  </div>
}

function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: client, error, load } = useData<Client>(`/clients/${id}`)
  const [edit, setEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  async function remove() { if (!client || !window.confirm(`Të fshihet ${fullName(client)} dhe të gjitha dokumentet/terminet?`)) return; try { await api(`/clients/${id}`, { method: 'DELETE' }); navigate('/clients') } catch (err) { setActionError((err as Error).message) } }
  async function upload(file: File | undefined) { if (!file) return; setBusy(true); setActionError(''); const body = new FormData(); body.append('file', file); try { await api(`/clients/${id}/documents`, { method: 'POST', body }); await load() } catch (err) { setActionError((err as Error).message) } finally { setBusy(false) } }
  async function removeDoc(docId: number) { if (!window.confirm('Të fshihet dokumenti?')) return; try { await api(`/clients/${id}/documents/${docId}`, { method: 'DELETE' }); await load() } catch (err) { setActionError((err as Error).message) } }
  if (error) return <div className="error">{error}</div>
  if (!client) return <div className="loading">Duke ngarkuar klientin…</div>
  return <><NavLink to="/clients" className="back-link"><ArrowLeft size={18}/> Kthehu te klientët</NavLink><div className="detail-head"><div className="detail-avatar">{initials(client)}</div><div><span className="eyebrow">PROFILI I KLIENTIT</span><h1>{fullName(client)}</h1><p>{client.phone}</p></div><button className="button ghost" onClick={() => setEdit(true)}>Ndrysho</button></div><div className="detail-layout"><section className="panel"><div className="panel-head"><div><span className="eyebrow">ARKIVA</span><h2>Dokumentet</h2></div><label className="button primary upload-button"><Upload size={17}/> {busy ? 'Duke ngarkuar…' : 'Ngarko dokument'}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx" disabled={busy} onChange={e => { upload(e.target.files?.[0]); e.target.value = '' }}/></label></div>{actionError && <div className="error">{actionError}</div>}{client.documents.length ? <div className="doc-list">{client.documents.map(doc => <div className="doc-row" key={doc.id}><div className="doc-icon">{doc.content_type.startsWith("image/") ? <ImageIcon size={21}/> : <FileText size={21}/>}</div><div><strong>{doc.original_name}</strong><span>{Math.max(1, Math.round(doc.size_bytes / 1024))} KB · {dateText(doc.created_at)}</span></div>{(doc.content_type.startsWith("image/") || doc.content_type === "application/pdf") && <button className="doc-view" title="Shiko" aria-label={`Shiko ${doc.original_name}`} onClick={() => setPreviewDocument(doc)}><Eye size={17}/><span>Shiko</span></button>}<button className="icon-button" title="Shkarko" aria-label="Shkarko" onClick={() => downloadDocument(client.id, doc).catch(err => setActionError(err.message))}><Download size={18}/></button><button className="icon-button danger" title="Fshi" aria-label="Fshi" onClick={() => removeDoc(doc.id)}><Trash2 size={18}/></button></div>)}</div> : <div className="mini-empty">Ende nuk ka dokumente për këtë klient.</div>}</section><aside className="panel info-panel"><span className="eyebrow">DETAJET</span><h2>Informacioni</h2><div className="info-line"><span>Emri i plotë</span><strong>{fullName(client)}</strong></div><div className="info-line"><span>Numri i kontaktit</span><a href={`tel:${client.phone}`}>{client.phone}</a></div><div className="info-line"><span>Regjistruar më</span><strong>{dateText(client.created_at)}</strong></div><button className="delete-link" onClick={remove}><Trash2 size={16}/> Fshi klientin</button></aside></div>{edit && <ClientModal client={client} onClose={() => setEdit(false)} onSaved={async () => { setEdit(false); await load() }}/>} {previewDocument && <DocumentPreview clientId={client.id} initialDocument={previewDocument} documents={client.documents} onClose={() => setPreviewDocument(null)}/>}</>
}

function Appointments() {
  const { data: appointments, error, load } = useData<Appointment[]>('/appointments')
  const { data: clients } = useData<Client[]>('/clients')
  const [modal, setModal] = useState<Appointment | 'new' | null>(null)
  const [actionError, setActionError] = useState('')
  const upcoming = (appointments || []).filter(item => new Date(item.starts_at).getTime() >= Date.now())
  const past = (appointments || []).filter(item => new Date(item.starts_at).getTime() < Date.now()).reverse()
  async function remove(id: number) { if (!window.confirm('Të fshihet termini?')) return; try { await api(`/appointments/${id}`, { method: 'DELETE' }); await load() } catch (err) { setActionError((err as Error).message) } }
  const actions = (item: Appointment) => <div className="row-actions"><button className="text-button" onClick={() => setModal(item)}>Ndrysho</button><button className="icon-button danger" title="Fshi termin" aria-label="Fshi termin" onClick={() => remove(item.id)}><Trash2 size={17}/></button></div>
  return <><PageHeader eyebrow="KALENDARI" title="Terminet" description="Takimet e ardhshme, të renditura qartë sipas datës dhe orës." action={<button className="button primary" onClick={() => setModal('new')}><Plus size={18}/> Termin i ri</button>} />{error && <div className="error">{error}</div>}{actionError && <div className="error">{actionError}</div>}<div className="section-heading appointments-heading"><div><span className="eyebrow">NË VIJIM</span><h2>Terminet e ardhshme <span className="pill">{upcoming.length}</span></h2></div></div>{appointments && !upcoming.length ? <Empty icon={<CalendarDays size={28}/>} title="Nuk ka termine në vazhdim" text="Shtoni takimin e radhës për ta parë këtu." /> : <div className="appointment-list">{upcoming.map(item => <AppointmentRow key={item.id} appointment={item} actions={actions(item)}/>)}</div>}{past.length > 0 && <><div className="section-heading past-heading"><div><span className="eyebrow">HISTORIKU</span><h2>Terminet e kaluara</h2></div></div><div className="appointment-list past-list">{past.map(item => <AppointmentRow key={item.id} appointment={item} actions={actions(item)}/>)}</div></>}{modal && <AppointmentModal appointment={modal === 'new' ? undefined : modal} clients={clients || []} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load() }}/>}</>
}

function ClientPicker({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (id: string) => void }) {
  const selected = clients.find(client => String(client.id) === value)
  const [query, setQuery] = useState(selected ? fullName(selected) : '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = clients.filter(client =>
    `${fullName(client)} ${client.phone}`.toLocaleLowerCase('sq').includes(query.trim().toLocaleLowerCase('sq'))
  )

  useEffect(() => {
    if (selected && !open) setQuery(fullName(selected))
  }, [selected, open])

  function choose(client: Client) {
    onChange(String(client.id))
    setQuery(fullName(client))
    setOpen(false)
  }

  return <div className="client-picker" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false)
      if (selected) setQuery(fullName(selected))
    }
  }}>
    <label htmlFor="appointment-client">Klienti</label>
    <div className="client-picker-input">
      <Search size={18} aria-hidden="true" />
      <input
        id="appointment-client"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="appointment-client-options"
        aria-activedescendant={open && matches[activeIndex] ? `appointment-client-${matches[activeIndex].id}` : undefined}
        autoComplete="off"
        placeholder="Kërko klientin..."
        value={query}
        onFocus={event => { setOpen(true); event.currentTarget.select() }}
        onChange={event => { setQuery(event.target.value); onChange(''); setActiveIndex(0); setOpen(true) }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex(index => Math.min(index + 1, matches.length - 1)) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)) }
          if (event.key === 'Enter' && open && matches[activeIndex]) { event.preventDefault(); choose(matches[activeIndex]) }
          if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false) }
        }}
      />
    </div>
    {open && <div id="appointment-client-options" className="client-picker-options" role="listbox">
      {matches.length ? matches.map((client, index) => <button
        type="button"
        role="option"
        aria-selected={String(client.id) === value}
        id={`appointment-client-${client.id}`}
        className={`client-picker-option ${index === activeIndex ? 'highlighted' : ''}`}
        key={client.id}
        onMouseDown={event => event.preventDefault()}
        onClick={() => choose(client)}
      ><span className="picker-avatar">{initials(client)}</span><span><strong>{fullName(client)}</strong><small>{client.phone}</small></span></button>)
        : <div className="client-picker-empty">Nuk u gjet asnjë klient.</div>}
    </div>}
  </div>
}

function AppointmentModal({ appointment, clients, onClose, onSaved }: { appointment?: Appointment; clients: Client[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const original = appointment ? new Date(appointment.starts_at) : null
  const [clientId, setClientId] = useState(String(appointment?.client_id || ''))
  const [date, setDate] = useState(original ? `${original.getFullYear()}-${String(original.getMonth() + 1).padStart(2, '0')}-${String(original.getDate()).padStart(2, '0')}` : '')
  const [time, setTime] = useState(original ? `${String(original.getHours()).padStart(2, '0')}:${String(original.getMinutes()).padStart(2, '0')}` : '')
  const [notes, setNotes] = useState(appointment?.notes || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { if (!clientId) throw new Error('Zgjidhni një klient nga lista.'); const starts = new Date(`${date}T${time}`); if (Number.isNaN(starts.getTime())) throw new Error('Zgjidhni datën dhe orën.'); await api(`/appointments${appointment ? `/${appointment.id}` : ''}`, { method: appointment ? 'PATCH' : 'POST', body: JSON.stringify({ client_id: Number(clientId), starts_at: starts.toISOString(), notes: notes || null }) }); await onSaved() } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <Modal title={appointment ? 'Ndrysho terminin' : 'Termin i ri'} onClose={onClose}><form className="form" onSubmit={submit}><ClientPicker clients={clients} value={clientId} onChange={setClientId} />{!clients.length && <p className="form-hint">Së pari shtoni një klient te faqja Klientët.</p>}<div className="form-row"><label>Data<input type="date" required value={date} onChange={e => setDate(e.target.value)}/></label><label>Ora<input type="time" required value={time} onChange={e => setTime(e.target.value)}/></label></div><label>Shënime <span className="optional">(opsionale)</span><textarea maxLength={1000} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Shtoni një shënim të shkurtër…"/></label>{error && <div className="error">{error}</div>}<div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>Anulo</button><button disabled={busy || !clients.length} className="button primary">{busy ? 'Duke ruajtur…' : 'Ruaj terminin'}</button></div></form></Modal>
}

export default function App() { return <BrowserRouter><AppRoutes/></BrowserRouter> }
