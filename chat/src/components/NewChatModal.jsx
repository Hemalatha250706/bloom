import React, { useState } from 'react';
import { X, UserPlus, AtSign, User, UserCheck } from 'lucide-react';

export default function NewChatModal({ isOpen, onClose, onStartChat }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanId = identifier.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter contact name.');
      return;
    }

    if (!cleanId) {
      setError('Please enter a User ID or Email address.');
      return;
    }

    // Determine if it is an email or a custom User ID
    const isEmail = cleanId.includes('@') && cleanId.includes('.');
    const cleanUserId = isEmail
      ? cleanId.split('@')[0].replace(/^@/, '')
      : cleanId.replace(/^@/, '');
    const cleanEmail = isEmail ? cleanId : `${cleanUserId}@bloom.chat`;

    onStartChat({
      name: cleanName,
      userId: cleanUserId,
      email: cleanEmail,
      avatar: '', // Custom avatar set by user or initials
    });

    setName('');
    setIdentifier('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-violet-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Chat & Contact</h2>
              <p className="text-xs text-violet-100">Save contact via User ID or Email 🌸</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Contact Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Contact Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-violet-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Name"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-stone-800 font-medium"
              />
            </div>
          </div>

          {/* Contact User ID or Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5 text-violet-600" />
              <span>User ID or Email *</span>
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-violet-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="e.g. keerthi or user@bloom.chat"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-stone-800 font-medium"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Enter their unique User ID or Email to start chatting immediately.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Save & Start Chat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
