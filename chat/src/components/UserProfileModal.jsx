import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Camera,
  Edit2,
  Check,
  LogOut,
  Upload,
  Info,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { ABOUT_PRESETS } from '../data/mockData';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
];

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
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    if (onUpdateCurrentUser && isCurrentUser) {
      onUpdateCurrentUser({
        ...user,
        ...formData,
      });
    }
    setIsEditing(false);
    setSavedSuccess('Profile updated successfully!');
    setTimeout(() => setSavedSuccess(''), 2200);
  };

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
                    about: user.about || 'Available 🌸',
                    email: user.email || '',
                    phone: user.phone || '',
                    avatar: user.avatar || '',
                  });
                }
                setIsEditing(!isEditing);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
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
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 flex items-center justify-center shadow-md transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="relative overflow-y-auto flex-1 pr-1 space-y-4">
          {/* Avatar and Prominent Photo Change/Delete Controls */}
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
                title={isCurrentUser ? 'Click to change or upload photo' : ''}
              >
                {hasPhoto ? (
                  <img
                    src={currentAvatar}
                    alt={formData.name || user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 text-white font-extrabold text-3xl flex items-center justify-center select-none">
                    {getInitials(formData.name || user.name)}
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
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white flex items-center justify-center shadow-lg ring-2 ring-white hover:scale-110 active:scale-95 transition-all z-20"
                  title="Photo options"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons: Change Photo & Delete Photo */}
            {isCurrentUser && (
              <div className="flex items-center gap-2 mt-1">
                {/* Change/Upload Photo Button */}
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  className="px-3 py-1 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-violet-600" />
                  <span>{hasPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {/* DELETE PHOTO BUTTON (Deletes existing image) */}
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
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

            {/* Photo Selection Drawer / Popover */}
            {showPhotoOptions && isCurrentUser && (
              <div className="mt-3 p-3.5 bg-violet-50/95 border border-violet-200 rounded-2xl w-full animate-in fade-in zoom-in-95 duration-100 shadow-lg text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
                    <span>Profile Photo Options</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPhotoOptions(false)}
                    className="p-1 rounded-full hover:bg-violet-200 text-stone-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Option 1: Upload from Device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors mb-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload from Device</span>
                </button>

                {/* Option 2: Delete Current Image (if photo exists) */}
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="w-full py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors mb-3 border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Current Photo</span>
                  </button>
                )}

                {/* Option 3: Choose Avatar Presets */}
                <div>
                  <span className="block text-[11px] font-semibold text-stone-500 mb-1.5">
                    Or select an avatar preset:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AVATARS.map((avUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyAvatarUpdate(avUrl)}
                        className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white hover:ring-violet-500 transition-all hover:scale-105 shadow-xs mx-auto"
                        title={`Select Avatar ${i + 1}`}
                      >
                        <img src={avUrl} alt={`preset-${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

            {/* Name */}
            {!isEditing && (
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">{user.name}</h3>
            )}
          </div>

          {/* ---------------- ABOUT SECTION ---------------- */}
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
                    className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-200/60 transition-colors"
                    title="Change About"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Email & Phone */}
              <div className="space-y-2.5 py-2 border-t border-b border-stone-100 text-xs font-medium">
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
                {user.phone && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0 shadow-xs">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-stone-400 uppercase font-bold">Phone</span>
                      <span className="font-semibold text-stone-800">{user.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode: Set About and Edit Profile */
            <form onSubmit={handleSave} className="space-y-3.5 pt-1">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  required
                  className="w-full bg-stone-50 pl-3 pr-3 py-2 rounded-xl text-xs sm:text-sm text-stone-800 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 font-medium"
                />
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
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
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

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@bloom.chat"
                  className="w-full bg-stone-50 pl-3 pr-3 py-2 rounded-xl text-xs sm:text-sm text-stone-800 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-stone-50 pl-3 pr-3 py-2 rounded-xl text-xs sm:text-sm text-stone-800 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-violet-500/25"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
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
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-violet-400/30"
            >
              Close Profile
            </button>

            {onLogout && isCurrentUser && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-2 rounded-full border border-stone-200 hover:border-rose-200 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
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
