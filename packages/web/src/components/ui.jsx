// ui.jsx — pequenos componentes de apoio reutilizados nas telas.
import { Construction } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Placeholder({ tarefa, children }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Construction className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-slate-600">{children || 'Tela em construção.'}</p>
      {tarefa && <p className="text-xs text-slate-400 mt-2 font-mono">Tarefa {tarefa}</p>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900',
    good: 'text-emerald-600',
    warn: 'text-amber-600',
    bad: 'text-rose-600',
  };
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <p className={`text-3xl font-semibold mt-2 ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
