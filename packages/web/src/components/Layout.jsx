// Layout.jsx — moldura do app: navegação lateral + barra superior com papel.
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, DoorOpen, Users, Link2, Wand2, GitCompare,
  ScrollText, Activity, FlaskConical, Building2,
} from 'lucide-react';
import { useApp } from '../state/AppState.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, papel: 'geral' },
  { to: '/salas', label: 'Salas', icon: DoorOpen, papel: 'geral' },
  { to: '/setores', label: 'Setores & Equipes', icon: Users, papel: 'ambos' },
  { to: '/restricoes', label: 'Restrições', icon: Link2, papel: 'ambos' },
  { to: '/alocacao', label: 'Alocação', icon: Wand2, papel: 'geral' },
  { to: '/comparacao', label: 'Comparação', icon: GitCompare, papel: 'geral' },
  { to: '/governanca', label: 'Governança', icon: ScrollText, papel: 'geral' },
  { to: '/monitoramento', label: 'Monitoramento', icon: Activity, papel: 'geral' },
  { to: '/testes', label: 'Critérios & Testes', icon: FlaskConical, papel: 'geral' },
];

function RoleSwitch() {
  const { role, setRole } = useApp();
  const opcoes = [
    { id: 'geral', label: 'Coordenador Geral' },
    { id: 'setor', label: 'Coordenador de Setor' },
  ];
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1">
      {opcoes.map((o) => (
        <button
          key={o.id}
          onClick={() => setRole(o.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            role === o.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Layout({ children }) {
  const { role } = useApp();
  const itens = NAV.filter((n) => n.papel === 'ambos' || n.papel === role);

  return (
    <div className="min-h-screen flex">
      {/* Navegação lateral */}
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-semibold text-sm">Espaços</p>
            <p className="text-[11px] text-slate-400">Gestão &amp; Otimização</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {itens.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-2 border-teal-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          MVP · allocation-engine-v1
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <p className="text-sm text-slate-400">Prédio corporativo · 9 andares</p>
          <RoleSwitch />
        </header>
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
