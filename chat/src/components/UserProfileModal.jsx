import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mail,
  Camera,
  Edit2,
  Check,
  LogOut,
  Upload,
  Info,
  Trash2,
  AtSign,
} from 'lucide-react';
import { ABOUT_PRESETS } from '../data/mockData';

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  isCurrentUser = false,
  onUpdateCurrentUser,
  onLogout,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    about: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Sync form data on open or user change
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        userId: user.userId || user.email?.split('@')[0] || '',
        about: user.about || 'Available 🌸',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
      setIsEditing(false);
      setShowPhotoOptions(false);
      setSavedSuccess('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isOnline = user.status === 'online';
  const currentAvatar = formData.avatar || user.avatar;
  const hasPhoto = Boolean(currentAvatar && currentAvatar.trim());

  // Helper to get initials
  const getInitials = (val) => {
    if (!val) return 'U';
    return val.replace(/^@/, '').slice(0, 2).toUpperCase();
  };

  // Apply avatar update immediately
  const applyAvatarUpdate = (newAvatarUrl) => {
    setFormData((prev) => ({ ...prev, avatar: newAvatarUrl }));
    if (onUpdateCurrentUser && isCurrentUser) {
      onUpdateCurrentUser({
        ...user,
        ...formData,
        avatar: newAvatarUrl,
      });
    }
    setShowPhotoOptions(false);
    if (!newAvatarUrl) {
      setSavedSuccess('Profile photo deleted!');
    } else {
      setSavedSuccess('Profile photo updated!');
    }
    setTimeout(() => setSavedSuccess(''), 2200);
  };

  // Handle local image file upload from device
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        applyAvatarUpdate(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Delete/Remove Image
  const handleDeletePhoto = () => {
    applyAvatarUpdate('');
  };

  // Quick select an About preset
  const handleSelectAboutPreset = (preset) => {
    setFormData((prev) => ({ ...prev, about: preset }));
  };

  // Save changes
  const handleSave = (e) => {
    e?.preventDefault();
    const cleanUsername = (formData.userId || '').toLowerCase().trim().replace(/^@/, '');
    if (onUpdateCurrentUser && isCurrentUser) {
      onUpdateCurrentUser({
        ...user,
        ...formData,
        userId: cleanUsername,
        name: cleanUsername,
      });
    }
    setIsEditing(false);
    setSavedSuccess('Profile updated successfully!');
    setTimeout(() => setSavedSuccess(''), 2200);
  };

  const displayUserId = (
    user.userId ||
    formData.userId ||
    user.email?.split('@')[0] ||
    'user'
  ).replace(/^@/, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-violet-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Decorative lavender gradient header */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 pointer-events-none" />

        {/* Header action buttons */}
        <div className="relative flex items-center justify-between z-10 mb-4">
          {isCurrentUser && (
            <button
              onClick={() => {
                if (isEditing) {
                  // Cancel
                  setFormData({
                    name: user.name || '',
                    userId: user.userId || user.email?.split('@')[0] || '',
                    about: user.about || 'Available 🌸',
                    email: user.email || '',
                    phone: user.phone || '',
                    avatar: user.avatar || '',
                  });
                }
                setIsEditing(!isEditing);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isEditing
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  : 'bg-white/90 hover:bg-white text-violet-800'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          )}

          {!isCurrentUser && <div />}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 flex items-center justify-center shadow-md transition-colors ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="relative overflow-y-auto flex-1 pr-1 space-y-4">
          {/* Avatar and Prominent Photo Controls */}
          <div className="flex flex-col items-center text-center pt-2">
            <div className="relative mb-2">
              {/* Profile Avatar Image or Initials Placeholder */}
              <div
                onClick={() => {
                  if (isCurrentUser) fileInputRef.current?.click();
                }}
                className={`relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-xl ${
                  isCurrentUser ? 'cursor-pointer hover:ring-violet-300' : ''
                } transition-all`}
                title={isCurrentUser ? 'Click to upload your photo' : ''}
              >
                {hasPhoto ? (
                  <img
                    src={currentAvatar}
                    alt={`@${displayUserId}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 text-white font-extrabold text-3xl flex items-center justify-center select-none">
                    {getInitials(displayUserId)}
                  </div>
                )}
              </div>

              {/* Show green dot ONLY if online */}
              {isOnline && (
                <span
                  className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs z-10"
                  title="Online"
                />
              )}

              {/* Camera Icon Button on Avatar */}
              {isCurrentUser && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white flex items-center justify-center shadow-lg ring-2 ring-white hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
                  title="Upload profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons: Change Photo & Delete Photo */}
            {isCurrentUser && (
              <div className="flex items-center gap-2 mt-1">
                {/* Upload from Device Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-violet-600" />
                  <span>{hasPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {/* DELETE PHOTO BUTTON (Deletes existing image) */}
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Delete current profile image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>
            )}

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Notification Banner */}
            {savedSuccess && (
              <div className="mt-2.5 px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{savedSuccess}</span>
              </div>
            )}

            {/* Online Badge (ONLY if online) */}
            {isOnline && (
              <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mt-2 mb-1">
                Online
              </span>
            )}

            {/* Username Heading */}
            {!isEditing && (
              <div className="mt-1">
                <h3 className="text-xl font-extrabold text-stone-900">@{displayUserId}</h3>
              </div>
            )}
          </div>

          {/* ---------------- ABOUT & CONTACT INFO ---------------- */}
          {!isEditing ? (
            /* View Mode: About & Contact Info */
            <div className="space-y-3 pt-1">
              {/* Dedicated About Card */}
              <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-200/80 text-violet-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-violet-600 uppercase tracking-wider">
                      About
                    </span>
                    <p className="text-sm font-semibold text-stone-800 mt-0.5 leading-relaxed">
                      {user.about || 'Available 🌸'}
                    </p>
                  </div>
                </div>

                {isCurrentUser && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-200/60 transition-colors cursor-pointer"
                    title="Change About"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Username & Email */}
              <div className="space-y-2.5 py-2 border-t border-b border-stone-100 text-xs font-medium">
                <div className="flex items-center gap-3 text-stone-700">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0 shadow-xs">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-400 uppercase font-bold">Username</span>
                    <span className="font-semibold text-stone-800">@{displayUserId}</span>
                  </div>
                </div>

                {user.email && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0 shadow-xs">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-stone-400 uppercase font-bold">Email</span>
                      <span className="font-semibold text-stone-800">{user.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode: Set Username & About (No separate Name field) */
            <form onSubmit={handleSave} className="space-y-3.5 pt-1">
              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative flex items-center">
                  <span className="text-violet-500 font-bold absolute left-3 select-none text-xs">@</span>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
                      setFormData({
                        ...formData,
                        userId: val,
                        name: val,
                      });
                    }}
                    placeholder="username"
                    required
                    className="w-full bg-stone-50 pl-7 pr-3 py-2 rounded-xl text-xs sm:text-sm text-stone-800 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 font-medium"
                  />
                </div>
              </div>

              {/* ABOUT (Set About input + quick presets) */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Set About
                </label>
                <input
                  type="text"
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="e.g. Available, Busy, At work..."
                  required
                  className="w-full bg-stone-50 pl-3 pr-3 py-2 rounded-xl text-xs sm:text-sm text-stone-800 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 font-medium"
                />

                {/* Quick About Presets to tap and set */}
                <div className="mt-2">
                  <span className="block text-[10px] font-semibold text-stone-400 mb-1.5">
                    Or select a quick About:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ABOUT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectAboutPreset(preset)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          formData.about === preset
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-stone-100 hover:bg-violet-100 text-stone-700 hover:text-violet-800 border border-stone-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-violet-500/25 cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        {!isEditing && (
          <div className="mt-4 pt-2 space-y-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-violet-400/30 cursor-pointer"
            >
              Close Profile
            </button>

            {onLogout && isCurrentUser && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-2 rounded-full border border-stone-200 hover:border-rose-200 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
