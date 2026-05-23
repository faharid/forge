import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const invite = params.get('invite');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password, tenantName || undefined);
      navigate('/dashboard');
    } catch {
      setError('Could not create account. Email may already exist.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold">Create account</h2>
        {invite && (
          <p className="text-sm text-indigo-400">You have been invited to join a workspace.</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input
          type="text"
          placeholder="Company name"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2"
          minLength={8}
          required
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500"
        >
          Sign up
        </button>
        <p className="text-center text-sm text-slate-500">
          Have an account? <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
