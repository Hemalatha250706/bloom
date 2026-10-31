import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  User,
  Trash2,
  BellOff,
  Pin,
  PinOff,
} from 'lucide-react';

export default function ChatHeader({
  activeUser,
  isPinned = false,
  onTogglePin,
  onBackToList,
  onOpenProfile,
  onClearChat,
  onDeleteConversation,
  onTriggerCall,
  isTyping,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeUser) return null;

  const isOnline = activeUser.status === 'online';

  return (
    <header className="px-4 py-3 bg-white/95 border-b border-violet-100/90 backdrop-blur-md flex items-center justify-between z-10 transition-colors shadow-xs">
      {/* Left: Back button (mobile) & User info */}
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={onBackToList}
          className="md:hidden p-2 -ml-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-violet-50 transition-colors"
          title="Back to conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Profile Avatar with ONLY Green Online Dot */}
        <div
          onClick={onOpenProfile}
          className="relative cursor-pointer group flex-shrink-0"
          title="Click to view profile"
        >
          {activeUser.avatar ? (
            <img
              src={activeUser.avatar}
              alt={activeUser.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-300 group-hover:ring-violet-500 transition-all shadow-xs"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-violet-300 group-hover:ring-violet-500 transition-all shadow-xs">
              {activeUser.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          {/* Show green dot ONLY if online */}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs" />
          )}
        </div>

        {/* Name and Status */}
        <div className="cursor-pointer" onClick={onOpenProfile}>
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-stone-900 text-sm sm:text-base leading-tight group-hover:text-violet-800 transition-colors">
              {activeUser.name}
            </h2>
            {activeUser.userId && (
              <span className="text-xs text-stone-400 font-normal">
                @{activeUser.userId.replace(/^@/, '')}
              </span>
            )}
            {isPinned && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin && onTogglePin();
                }}
                className="p-0.5 rounded text-violet-600 hover:text-rose-600 transition-colors cursor-pointer"
                title="Pinned chat - click to unpin"
              >
                <Pin className="w-3.5 h-3.5 fill-violet-300 hover:fill-rose-300" />
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500 leading-normal flex items-center gap-1.5 mt-0.5 font-medium">
            {isTyping ? (
              <span className="text-violet-600 font-bold flex items-center gap-1.5">
                <span className="flex gap-0.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]" />
                </span>
                typing...
              </span>
            ) : isOnline ? (
              <span className="text-emerald-600 font-semibold">
                Online
              </span>
            ) : (
              <span className="text-stone-400">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onTriggerCall && onTriggerCall('audio', activeUser.name)}
          className="p-2 rounded-full text-stone-600 hover:text-violet-800 hover:bg-violet-100 transition-colors"
          title="Start voice call"
        >
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
        </button>

        <button
          onClick={() => onTriggerCall && onTriggerCall('video', activeUser.name)}
          className="p-2 rounded-full text-stone-600 hover:text-purple-800 hover:bg-purple-100 transition-colors"
          title="Start video call"
        >
          <Video className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
        </button>

        <button
          onClick={onOpenProfile}
          className="p-2 rounded-full text-stone-600 hover:text-violet-800 hover:bg-violet-100 transition-colors hidden sm:flex"
          title="View profile details"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
        </button>

        {/* More Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 z-30 w-52 bg-white border border-stone-200 rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-violet-50 hover:text-violet-800 transition-colors"
              >
                <User className="w-4 h-4 text-violet-600" />
                <span>Contact Details</span>
              </button>

              {/* Pin / Unpin Action */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onTogglePin && onTogglePin();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-violet-50 hover:text-violet-800 transition-colors cursor-pointer"
              >
                {isPinned ? (
                  <>
                    <PinOff className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-600">Unpin Chat</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 text-violet-600" />
                    <span>Pin Chat to Top</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  alert(`Notifications muted for ${activeUser.name}`);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
              >
                <BellOff className="w-4 h-4 text-purple-500" />
                <span>Mute Notifications</span>
              </button>
              <div className="my-1 border-t border-stone-100" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onClearChat && onClearChat();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-stone-500" />
                <span>Clear Chat History</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDeleteConversation && onDeleteConversation();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Delete Chat & Contact</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
