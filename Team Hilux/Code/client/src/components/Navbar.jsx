import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Sliders,
  Wifi, Sparkles, PlusCircle, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/log',       label: 'Log',       icon: PlusCircle      },
  { to: '/patterns',  label: 'Patterns',  icon: BarChart2       },
  { to: '/simulator', label: 'Simulator', icon: Sliders         },
  { to: '/coach',     label: 'AI Coach',  icon: Sparkles        },
  { to: '/sync',      label: 'Sync',      icon: Wifi            },
];

export default function Navbar() {
  const { pathname }    = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Loom</span>
          <span className="hidden sm:block text-xs text-indigo-400 font-medium bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            Wellness AI
          </span>
        </Link>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <span className="hidden lg:block text-slate-500 text-xs">
              {user.name}
            </span>
          )}
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
}
