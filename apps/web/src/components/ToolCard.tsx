import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router-dom';

type ToolCardProps = {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  name: string;
  description: string;
  badge?: string;
};

export function ToolCard({ to, icon: Icon, name, description, badge }: ToolCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition group-hover:bg-indigo-500 group-hover:text-white">
          <Icon size={22} />
        </span>
        {badge && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-white">{name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      <span className="mt-auto text-sm font-medium text-indigo-400 opacity-0 transition group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}
