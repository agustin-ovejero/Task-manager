'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Task = { id: number; title: string; completed: boolean }
type Filter = 'all' | 'pending' | 'completed'

const initialTasks: Task[] = [
  { id: 1, title: 'Preparar entorno de Playwright', completed: true },
  { id: 2, title: 'Escribir el primer test', completed: false },
  { id: 3, title: 'Validar accesibilidad', completed: false },
]

function Spinner({ label = 'Cargando' }: { label?: string }) {
  return <span className="spinner" aria-label={label} role="status" />
}

function Header() {
  const router = useRouter()
  return (
    <header className="site-header">
      <a className="brand" href="/tasks" aria-label="Task Lab, ir a tareas">
        <span className="brand-mark" aria-hidden="true">TL</span>
        <span>Task Lab</span>
      </a>
      <nav aria-label="Navegación principal">
        <a href="/tasks">Tareas</a><a href="/embed">Iframe</a><a href="/shadow">Shadow DOM</a><a href="/delayed">Carga tardía</a>
      </nav>
      <button className="button button-ghost" onClick={() => { localStorage.removeItem('task-lab-auth'); router.push('/login') }}>Cerrar sesión</button>
    </header>
  )
}

export function LoginPage() {
  const router = useRouter(); const [user, setUser] = useState(''); const [pass, setPass] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); window.setTimeout(() => { if (user === 'tester' && pass === 'playwright123') { localStorage.setItem('task-lab-auth', 'true'); router.push('/tasks') } else { setError('El usuario o la contraseña no son válidos.'); setLoading(false) } }, 1500) }
  return <main className="auth-shell"><section className="auth-card" aria-labelledby="login-title"><div className="eyebrow">LABORATORIO DE PRUEBAS</div><h1 id="login-title">Bienvenido a Task Lab</h1><p className="muted">Practica flujos reales de automatización con una interfaz accesible.</p><form onSubmit={submit}><label htmlFor="username">Usuario</label><input id="username" name="username" autoComplete="username" value={user} onChange={e => setUser(e.target.value)} required /><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} required /><div className="status" aria-live="polite">{error}</div><button className="button button-primary full" type="submit" disabled={loading}>{loading ? <><Spinner label="Validando credenciales" /> Validando...</> : 'Iniciar sesión'}</button></form><p className="hint">Prueba con <strong>tester</strong> / <strong>playwright123</strong></p></section></main>
}

function DeleteDialog({ task, onCancel, onConfirm }: { task: Task; onCancel: () => void; onConfirm: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { confirmRef.current?.focus(); const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey) }, [onCancel])
  return <div className="dialog-backdrop" role="presentation"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">¿Eliminar tarea?</h2><p>Se eliminará “{task.title}”. Esta acción no se puede deshacer.</p><div className="dialog-actions"><button className="button button-ghost" onClick={onCancel}>Cancelar</button><button className="button button-danger" ref={confirmRef} onClick={onConfirm}>Confirmar</button></div></section></div>
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState<Filter>('all'); const [adding, setAdding] = useState(false); const [title, setTitle] = useState(''); const [deleting, setDeleting] = useState<Task | null>(null)
  useEffect(() => { const saved = localStorage.getItem('task-lab-tasks'); window.setTimeout(() => { setTasks(saved ? JSON.parse(saved) : initialTasks); setLoading(false) }, 1000) }, [])
  useEffect(() => { if (!loading) localStorage.setItem('task-lab-tasks', JSON.stringify(tasks)) }, [tasks, loading])
  const visible = tasks.filter(task => filter === 'all' || (filter === 'pending' ? !task.completed : task.completed)); const pending = tasks.filter(task => !task.completed).length
  function addTask(e: FormEvent) { e.preventDefault(); if (!title.trim()) return; setTasks([...tasks, { id: Date.now(), title: title.trim(), completed: false }]); setTitle(''); setAdding(false) }
  return <><Header /><main className="page-shell"><div className="page-heading"><div><div className="eyebrow">ESPACIO DE TRABAJO</div><h1>Mis tareas</h1><p className="muted">Un entorno controlado para practicar tus locators.</p></div><button className="button button-primary" onClick={() => setAdding(true)}>+ Agregar tarea</button></div><div className="toolbar"><div className="filters" role="group" aria-label="Filtrar tareas">{([['all','Todas'],['pending','Pendientes'],['completed','Completadas']] as [Filter,string][]).map(([value, label]) => <button key={value} className={`filter ${filter === value ? 'selected' : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><p className="counter" aria-live="polite"><strong>{pending}</strong> {pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}</p></div>{adding && <form className="add-form" onSubmit={addTask}><label htmlFor="new-task">Nombre de la tarea</label><div className="add-row"><input id="new-task" value={title} onChange={e => setTitle(e.target.value)} autoFocus required /><button className="button button-primary" type="submit">Guardar</button><button className="button button-ghost" type="button" onClick={() => setAdding(false)}>Cancelar</button></div></form>}<section className="task-card" aria-busy={loading}><div className="card-label">LISTA ACTUAL</div>{loading ? <div className="loading"><Spinner label="Cargando tareas" /><span>Cargando tareas...</span></div> : <ul className="task-list">{visible.map(task => <li key={task.id} className={task.completed ? 'completed' : ''}><label className="task-label"><input type="checkbox" checked={task.completed} onChange={() => setTasks(tasks.map(item => item.id === task.id ? { ...item, completed: !item.completed } : item))} /><span>{task.title}</span></label><button className="button button-delete" onClick={() => setDeleting(task)}>Eliminar</button></li>)}{visible.length === 0 && <li className="empty">No hay tareas en este filtro.</li>}</ul>}</section></main>{deleting && <DeleteDialog task={deleting} onCancel={() => setDeleting(null)} onConfirm={() => { setTasks(tasks.filter(task => task.id !== deleting.id)); setDeleting(null) }} />}</>
}

export function EmbeddedForm() { const [name, setName] = useState(''); const [greeting, setGreeting] = useState(''); return <main className="embedded-shell"><div className="eyebrow">FORMULARIO EMBEBIDO</div><h1>Saluda desde el iframe</h1><form onSubmit={e => { e.preventDefault(); setGreeting(`Hola, ${name}`) }}><label htmlFor="embedded-name">Nombre</label><input id="embedded-name" value={name} onChange={e => setName(e.target.value)} required /><button className="button button-primary" type="submit">Saludar</button></form><p className="greeting" aria-live="polite">{greeting}</p></main> }
export function EmbedPage() { return <><Header /><main className="page-shell"><div className="eyebrow">EXPERIMENTO 01</div><h1>Iframe interno</h1><p className="muted">Practica entrando en un contexto de frame.</p><iframe className="embedded-frame" src="/embedded-form" title="Formulario de saludo embebido" /></main></> }

export function ShadowPage() { const hostRef = useRef<HTMLDivElement>(null); useEffect(() => { const host = hostRef.current; if (!host || host.shadowRoot) return; const shadow = host.attachShadow({ mode: 'open' }); let count = 0; const wrapper = document.createElement('div'); wrapper.className = 'shadow-content'; const countText = document.createElement('span'); countText.textContent = 'Contador: 0'; const button = document.createElement('button'); button.textContent = 'Incrementar'; button.setAttribute('aria-label', 'Incrementar contador'); button.addEventListener('click', () => { count += 1; countText.textContent = `Contador: ${count}` }); const style = document.createElement('style'); style.textContent = '.shadow-content{display:flex;gap:16px;align-items:center;font:16px system-ui;color:#17212b}.shadow-content button{border:0;border-radius:8px;padding:10px 16px;background:#17212b;color:#fff;font-weight:700;cursor:pointer}'; wrapper.append(countText, button); shadow.append(style, wrapper) }, []); return <><Header /><main className="page-shell"><div className="eyebrow">EXPERIMENTO 02</div><h1>Shadow DOM</h1><p className="muted">El control vive dentro de un árbol Shadow DOM.</p><div className="experiment-card" ref={hostRef} /></main></> }

export function DelayedPage() { const [ready, setReady] = useState(false); useEffect(() => { const timer = window.setTimeout(() => setReady(true), 3000); return () => window.clearTimeout(timer) }, []); return <><Header /><main className="page-shell"><div className="eyebrow">EXPERIMENTO 03</div><h1>Elemento con aparición tardía</h1><p className="muted">Practica esperas explícitas y condiciones de visibilidad.</p><section className="experiment-card delayed-card"><p aria-live="polite">{ready ? 'El elemento está listo.' : 'Preparando...'}</p>{ready && <button className="button button-primary">Continuar</button>}</section></main></> }

export function AppRouter() { const pathname = usePathname(); useEffect(() => { if (pathname !== '/login' && pathname !== '/embedded-form' && !localStorage.getItem('task-lab-auth')) window.location.href = '/login' }, [pathname]); if (pathname === '/login') return <LoginPage />; if (pathname === '/embedded-form') return <EmbeddedForm />; if (pathname === '/embed') return <EmbedPage />; if (pathname === '/shadow') return <ShadowPage />; if (pathname === '/delayed') return <DelayedPage />; return <TasksPage /> }
