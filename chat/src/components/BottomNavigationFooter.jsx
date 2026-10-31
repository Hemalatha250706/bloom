import React from 'react';
import {
  MessageSquare,
  CircleDot,
  Camera,
  LogOut,
  User,
} from 'lucide-react';

export default function BottomNavigationFooter({
  activeNavTab,
  onSelectNavTab,
  onOpenLiveCamera,
  currentUser,
  onOpenUserProfile,
  onLogout,
  unreadCount = 0,
}) {
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <footer className="w-full bg-white/95 border-t border-violet-100/90 backdrop-blur-md px-2 py-2 flex items-center justify-around z-20 flex-shrink-0 select-none shadow-xs">
      {/* 1. Chats Tab */}
      <button
        type="button"
        onClick={() => onSelectNavTab('chats')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-2xl transition-all cursor-pointer ${
          activeNavTab === 'chats'
            ? 'text-violet-700 bg-violet-100/70 font-bold shadow-xs'
            : 'text-stone-500 hover:text-violet-700 hover:bg-violet-50/60'
        }`}
        title="Chats"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && activeNavTab !== 'chats' && (
            <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Chats</span>
      </button>

      {/* 2. Status Tab */}
      <button
        type="button"
        onClick={() => onSelectNavTab('status')}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-2xl transition-all cursor-pointer ${
          activeNavTab === 'status'
            ? 'text-violet-700 bg-violet-100/70 font-bold shadow-xs'
            : 'text-stone-500 hover:text-violet-700 hover:bg-violet-50/60'
        }`}
        title="Status / Stories"
      >
        <div className="relative">
          <CircleDot className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-fuchsia-500 ring-1.5 ring-white" />
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Status</span>
      </button>

      {/* 3. Camera Button */}
      <button
        type="button"
        onClick={onOpenLiveCamera}
        className="flex flex-col items-center justify-center flex-1 py-1.5 rounded-2xl text-stone-500 hover:text-violet-700 hover:bg-violet-50/60 transition-colors cursor-pointer"
        title="Open Camera"
      >
        <Camera className="w-5 h-5" />
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Camera</span>
      </button>

      {/* 4. Profile Button */}
      <button
        type="button"
        onClick={onOpenUserProfile}
        className="flex flex-col items-center justify-center flex-1 py-1.5 rounded-2xl text-stone-500 hover:text-violet-700 hover:bg-violet-50/60 transition-colors cursor-pointer group"
        title="Profile & About"
      >
        <div className="relative">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full object-cover ring-1.5 ring-violet-300 group-hover:ring-violet-500 transition-all"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-500 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center ring-1.5 ring-violet-300">
              {userInitials}
            </div>
          )}
          {/* WhatsApp-style green online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Profile</span>
      </button>

      {/* 5. Sign Out Button */}
      <button
        type="button"
        onClick={onLogout}
        className="flex flex-col items-center justify-center flex-1 py-1.5 rounded-2xl text-stone-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
        title="Sign Out"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-[11px] mt-0.5 tracking-tight font-medium">Sign Out</span>
      </button>
    </footer>
  );
}
