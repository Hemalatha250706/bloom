import React, { useState, useEffect } from 'react';
import { X, Search, Mail, UserPlus, Check, Sparkles, MessageSquare } from 'lucide-react';
import { chatService } from '../services/chatService.js';

export default function NewChatModal({
  isOpen,
  onClose,
  onSelectUser,
  onOpenUserProfile,
  currentUser,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // When modal opens, load all registered users immediately
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setSearchQuery('');
    setError('');

    chatService
      .fetchRegisteredUsers(currentUser?.id)
      .then((users) => {
        if (!isMounted) return;
        const myUserId = (
          currentUser?.userId ||
          currentUser?.username ||
          currentUser?.name ||
          ''
        ).toLowerCase().trim().replace(/^@/, '');
        const myEmail = (currentUser?.email || '').toLowerCase().trim();

        const filtered = (users || []).filter(
          (u) =>
            u.id !== currentUser?.id &&
            u.username?.toLowerCase().trim() !== myUserId &&
            u.email?.toLowerCase().trim() !== myEmail
        );
        setRegisteredUsers(filtered);
      })
      .catch((err) => {
        console.warn('Error fetching registered users:', err);
        setError('Failed to load registered users.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser?.id, currentUser?.userId, currentUser?.username, currentUser?.email]);

  if (!isOpen) return null;

  const handleSelect = (user) => {
    if (onSelectUser) {
      onSelectUser(user);
    }
    onClose();
  };

  // Allow initiating chat with raw username handle
  const handleDirectUsernameConnect = (e) => {
    e?.preventDefault();
    const cleanHandle = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!cleanHandle) {
      setError('Please enter a username.');
      return;
    }
    const myUserId = (currentUser?.userId || currentUser?.username || currentUser?.name || '').toLowerCase().trim().replace(/^@/, '');
    if (cleanHandle === myUserId) {
      setError('You cannot start a chat with yourself.');
      return;
    }

    handleSelect({
      id: null,
      name: cleanHandle,
      userId: cleanHandle,
      username: cleanHandle,
      avatar_url: '',
      status_emoji: '🌸',
      status_text: 'Available',
      about: 'Available',
    });
  };

  // Filter users based on searchQuery
  const cleanQuery = searchQuery.trim().toLowerCase().replace(/^@/, '');
  const filteredUsers = cleanQuery
    ? registeredUsers.filter(
        (u) =>
          u.username?.toLowerCase().includes(cleanQuery) ||
          u.name?.toLowerCase().includes(cleanQuery) ||
          u.email?.toLowerCase().includes(cleanQuery)
      )
    : registeredUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-violet-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Conversation</h2>
              <p className="text-xs text-violet-100">Connect with registered Bloom users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-100 flex-shrink-0">
          <form onSubmit={handleDirectUsernameConnect}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-violet-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered users by username..."
                className="w-full bg-stone-50 pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {error && (
            <p className="mt-2 text-xs text-rose-600 font-medium px-1">{error}</p>
          )}
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {isLoading && (
            <div className="py-12 text-center text-xs text-stone-400 font-medium flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading registered users...</span>
            </div>
          )}

          {!isLoading && filteredUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Registered Users ({filteredUsers.length})
                </p>
                <span className="text-[11px] text-violet-600 font-semibold">
                  Tap to chat
                </span>
              </div>
              {filteredUsers.map((user) => {
                const displayName = (user.username || user.userId || user.name || 'user').replace(/^@/, '');
                return (
                  <div
                    key={user.id || user.username}
                    onClick={() => {
                      if (onOpenUserProfile) {
                        onOpenUserProfile(user);
                        onClose();
                      } else {
                        handleSelect(user);
                      }
                    }}
                    className="p-3 rounded-2xl border border-stone-100 hover:border-violet-200 bg-stone-50/50 hover:bg-violet-50/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all shadow-xs flex-shrink-0 select-none">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-900 group-hover:text-violet-950 truncate">
                          @{displayName}
                        </p>
                        <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                          <span>{user.status_emoji || '🌸'}</span>
                          <span>{user.status_text || user.about || 'Available'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(user);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && filteredUsers.length === 0 && cleanQuery && (
            <div className="py-8 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-800">No matching user found</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                No user registered with username "@{cleanQuery}".
              </p>
              <button
                type="button"
                onClick={handleDirectUsernameConnect}
                className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Message @{cleanQuery} directly</span>
              </button>
            </div>
          )}

          {!isLoading && filteredUsers.length === 0 && !cleanQuery && (
            <div className="py-10 text-center px-6 text-stone-400">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-violet-300" />
              <p className="text-xs font-medium text-stone-500">
                No other registered users found yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
