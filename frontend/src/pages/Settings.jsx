import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi, usersApi } from '../api/client';
import Modal from '../components/common/Modal';
import { Shield, UserPlus, RefreshCw, Trash2, KeyRound } from 'lucide-react';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function ChangePasswordSection({ user, onPasswordChanged }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (next !== confirm) { setError('Passwords do not match'); return; }
    if (!PASSWORD_RE.test(next)) { setError('Password must be 8+ chars with uppercase, number, and special character'); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: next });
      setSuccess('Password changed successfully');
      setCurrent(''); setNext(''); setConfirm('');
      onPasswordChanged?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="change-password" className="bg-dark-700 rounded-xl border border-dark-500 p-6 max-w-md">
      <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-accent-blue" /> Change Password
      </h2>
      {user?.must_change_password === 1 && (
        <div className="mb-4 p-3 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow text-sm">
          You must change your password before continuing.
        </div>
      )}
      {error && <div className="mb-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">{error}</div>}
      {success && <div className="mb-3 p-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm">{success}</div>}
      <form onSubmit={submit} className="space-y-4">
        {[
          ['Current Password', current, setCurrent, 'current-password'],
          ['New Password', next, setNext, 'new-password'],
          ['Confirm New Password', confirm, setConfirm, 'new-password'],
        ].map(([label, val, setter, autocomplete]) => (
          <div key={label}>
            <label className="block text-sm text-gray-300 mb-1">{label}</label>
            <input
              type="password"
              value={val}
              onChange={e => setter(e.target.value)}
              autoComplete={autocomplete}
              required
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const { user: me } = useApp();

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try { const r = await usersApi.list(); setUsers(r.data); } catch {}
  }

  async function createUser(e) {
    e.preventDefault(); setError('');
    try {
      await usersApi.create(form);
      setShowModal(false);
      setForm({ username: '', email: '', role: 'viewer' });
      setToast(`User ${form.username} created. Credentials sent to ${form.email}`);
      setTimeout(() => setToast(''), 4000);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  }

  async function toggleActive(u) {
    await usersApi.update(u.id, { is_active: u.is_active ? 0 : 1 });
    loadUsers();
  }

  async function resetPassword(u) {
    await usersApi.resetPassword(u.id);
    setToast(`Password reset email sent to ${u.email}`);
    setTimeout(() => setToast(''), 3000);
  }

  async function deleteUser(u) {
    if (!confirm(`Delete user ${u.username}?`)) return;
    try { await usersApi.delete(u.id); loadUsers(); } catch (err) {
      alert(err.response?.data?.error || 'Cannot delete user');
    }
  }

  const ROLE_COLOURS = { admin: 'text-accent-red', operator: 'text-accent-blue', viewer: 'text-gray-400' };

  return (
    <div className="bg-dark-700 rounded-xl border border-dark-500 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-blue" /> User Management
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {toast && (
        <div className="mb-3 p-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm">{toast}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-dark-500">
              {['Username', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {users.map(u => (
              <tr key={u.id} className="text-gray-300">
                <td className="py-2 pr-4 font-medium text-white">{u.username}</td>
                <td className="py-2 pr-4 text-xs">{u.email}</td>
                <td className="py-2 pr-4">
                  <span className={`text-xs font-semibold uppercase ${ROLE_COLOURS[u.role]}`}>{u.role}</span>
                </td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      u.is_active
                        ? 'text-accent-green border-accent-green/30 bg-accent-green/10'
                        : 'text-gray-500 border-gray-600 bg-dark-600'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => resetPassword(u)} title="Reset password"
                      className="p-1.5 rounded bg-dark-600 hover:bg-dark-500 text-gray-400 hover:text-white transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== me?.id && (
                      <button onClick={() => deleteUser(u)} title="Delete user"
                        className="p-1.5 rounded bg-dark-600 hover:bg-accent-red/20 text-gray-400 hover:text-accent-red transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add User" onClose={() => { setShowModal(false); setError(''); }}>
          {error && <div className="mb-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">{error}</div>}
          <form onSubmit={createUser} className="space-y-4">
            {[['Username', 'username', 'text'], ['Email', 'email', 'email']].map(([label, field, type]) => (
              <div key={field}>
                <label className="block text-sm text-gray-300 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  required
                  className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit"
              className="w-full bg-accent-blue hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors">
              Create User
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function Settings() {
  const { user, setUser: _setUser } = useApp();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#change-password') {
      document.getElementById('change-password')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <ChangePasswordSection user={user} />
      {user?.role === 'admin' && <UserManagement />}
    </div>
  );
}
