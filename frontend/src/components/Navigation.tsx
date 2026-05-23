import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TenantSwitcher } from './TenantSwitcher';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/settings', label: 'Settings' },
  { to: '/billing', label: 'Billing' },
];

export function Navigation() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-indigo-400">Forge</h1>
        <p className="text-xs text-slate-500">{user?.email}</p>
      </div>
      <TenantSwitcher />
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
      >
        Sign out
      </button>
    </aside>
  );
}
