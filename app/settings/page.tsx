'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AccountSettings() {
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const email = user?.emailAddresses?.[0]?.emailAddress || '';
  const authMethod = user?.externalAccounts?.length
    ? `Signed in with ${user.externalAccounts[0].provider === 'google' ? 'Google' : user.externalAccounts[0].provider}`
    : 'Signed in with email';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-zinc-100 mb-6">Account</h2>

      <div className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">
            Email
          </label>
          <p className="text-sm text-zinc-100">{email}</p>
        </div>

        {/* Auth method */}
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">
            Authentication
          </label>
          <p className="text-sm text-zinc-400">{authMethod}</p>
        </div>

        {/* Delete account */}
        <div className="pt-8 border-t border-zinc-800">
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Delete account</h3>
            <p className="text-sm text-zinc-400 mb-6">
              This will delete your account, all follows, and all data. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
