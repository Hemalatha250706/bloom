import React, { useState } from 'react';
import { X, UserPlus, Sparkles, Mail, Phone, User, Smartphone } from 'lucide-react';
import { cleanPhoneNumber } from '../services/chatService';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
];

const QUICK_NAMES = ['Amma 🌸', 'Appa 🌿', 'Friend 💜', 'Work 💼', 'Family 🏡'];

export default function NewChatModal({ isOpen, onClose, onStartChat }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanPhone = cleanPhoneNumber(phone.trim());
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('Please enter contact name.');
      return;
    }

    if (!cleanPhone && !cleanEmail) {
      setError('Please provide either a Mobile Number or Email address to connect.');
      return;
    }

    if (cleanPhone && cleanPhone.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid mobile number (at least 7 to 15 digits).');
      return;
    }

    if (cleanEmail && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
      setError('Please enter a valid email address.');
      return;
    }

    onStartChat({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      avatar: selectedAvatar,
    });

    setName('');
    setPhone('');
    setEmail('');
    setError('');
    onClose();
  };

  const handleSelectNamePreset = (presetName) => {
    setName(presetName);
    setError('');
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
              <h2 className="text-lg font-bold">Start a New Chat</h2>
              <p className="text-xs text-violet-100">Connect via Mobile Number or Email 🌸</p>
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

          {/* Quick Name Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Quick Contact Name
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_NAMES.map((qName) => (
                <button
                  key={qName}
                  type="button"
                  onClick={() => handleSelectNamePreset(qName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    name === qName
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/80'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  {qName}
                </button>
              ))}
            </div>
          </div>

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
                placeholder="e.g. Amma, Friend, Priya"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-stone-800 font-medium"
              />
            </div>
          </div>

          {/* Contact by Mobile Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-violet-600" />
                <span>Mobile Number</span>
              </label>
              <span className="text-[11px] text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-violet-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                placeholder="e.g. +91 98765 43210 or 9876543210"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-stone-800 font-medium"
              />
            </div>
          </div>

          {/* Contact by Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-violet-600" />
              <span>Email Address</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-violet-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="e.g. contact@gmail.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-stone-800 font-medium"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Enter either Mobile Number or Email (or both).
            </p>
          </div>

          {/* Choose Avatar */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Choose Avatar
            </label>
            <div className="flex items-center gap-2.5">
              {AVATAR_PRESETS.map((avUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avUrl)}
                  className={`relative rounded-full transition-transform cursor-pointer ${
                    selectedAvatar === avUrl
                      ? 'scale-115 ring-3 ring-violet-500 shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={avUrl}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
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
              <UserPlus className="w-4 h-4" />
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
