import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useTenant } from '../hooks/useTenant';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface UserRow {
  id: string;
  email: string;
  role: string;
}

export function DashboardPage() {
  const { get } = useApi();
  const { tenant } = useTenant();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<UserRow[]>('/users')
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [get]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="mt-1 text-slate-400">
        Welcome to {tenant?.name ?? 'your workspace'}
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
