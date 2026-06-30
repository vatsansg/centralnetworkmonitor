import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';
import { authApi } from '../api/client';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      login(res.data.token, res.data.user);
      if (res.data.user.must_change_password) {
        navigate('/settings#change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-700 mb-4">
            <Network className="w-8 h-8 text-accent-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white">Central Network Monitor</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-dark-700 rounded-xl p-8 shadow-2xl border border-dark-600">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-dark-600 border border-dark-400 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-dark-600 border border-dark-400 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
