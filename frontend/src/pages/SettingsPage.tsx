import { FormEvent, useState } from 'react';
import { tenantService } from '../services/tenant.service';
import { useTenant } from '../hooks/useTenant';

export function SettingsPage() {
  const { tenant, refresh } = useTenant();
  const [name, setName] = useState(tenant?.name ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await tenantService.updateMe(name);
    await refresh();
    setMessage('Settings saved');
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    const { data } = await tenantService.invite(inviteEmail);
    setMessage(`Invite sent. Link: ${data.inviteUrl}`);
    setInviteEmail('');
  };

  return (
    <div className="max-w-lg space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>
      {message && <p className="text-sm text-green-400">{message}</p>}
      <form onSubmit={handleSave} className="space-y-4">
        <label className="block text-sm text-slate-400">Workspace name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">
          Save
        </button>
      </form>
      <form onSubmit={handleInvite} className="space-y-4 border-t border-slate-800 pt-8">
        <h3 className="font-medium">Invite teammate</h3>
        <input
          type="email"
          placeholder="colleague@company.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
          required
        />
        <button type="submit" className="rounded-lg border border-indigo-500 px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-600/10">
          Send invite
        </button>
      </form>
    </div>
  );
}
