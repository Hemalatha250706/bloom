import React from 'react';
import {
  MessageSquare,
  CircleDot,
  Camera,
  LogOut,
  User,
} from 'lucide-react';

export default function NavigationRail({
  activeNavTab,
  onSelectNavTab,
  onOpenLiveCamera,
  currentUser,
  onOpenUserProfile,
  onLogout,
  unreadCount = 0,
}) {
  return (
    <div className="w-16 h-full bg-stone-50 border-r border-violet-100/90 flex flex-col items-center justify-between py-4 select-none z-10 flex-shrink-0">
      {/* Top Logo & Navigation Tabs */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Brand Flower Icon */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/30">
          <span className="text-xl">🌸</span>
        </div>

        {/* Navigation Icon List */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {/* 1. Chats Tab */}
          <button
            onClick={() => onSelectNavTab('chats')}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeNavTab === 'chats'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                : 'text-stone-500 hover:text-violet-700 hover:bg-violet-100/60'
            }`}
            title="Chats"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && activeNavTab !== 'chats' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white" />
            )}
          </button>

          {/* 2. Status Tab (On another side / dedicated panel) */}
          <button
            onClick={() => onSelectNavTab('status')}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeNavTab === 'status'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                : 'text-stone-500 hover:text-violet-700 hover:bg-violet-100/60'
            }`}
            title="Status / Stories"
          >
            <CircleDot className="w-5 h-5" />
            {/* Indicator ring / dot */}
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-fuchsia-500 ring-2 ring-white" />
          </button>

          {/* 3. Camera Tab (Direct camera trigger) */}
          <button
            onClick={onOpenLiveCamera}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-stone-500 hover:text-violet-700 hover:bg-violet-100/60 transition-colors"
            title="Open Camera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Profile Avatar & Logout */}
      <div className="flex flex-col items-center gap-3">
        {/* User Avatar with Green Online Dot */}
        <button
          onClick={onOpenUserProfile}
          className="relative group p-0.5 rounded-full hover:scale-105 transition-transform"
          title="Profile & About"
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-300 group-hover:ring-violet-500 shadow-xs"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-violet-300 shadow-xs">
              {currentUser.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          {/* Online green indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* Log Out */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

