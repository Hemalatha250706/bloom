import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Pin,
  PinOff,
  UserPlus,
  Trash2,
} from 'lucide-react';

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onTogglePin,
  onDeleteConversation,
  currentUser,
  onOpenNewChat,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Unread' | 'Favorites'

  // Filter conversations based on search and active filter, with deduplication guarantee
  const filteredConversations = useMemo(() => {
    // 1. Deduplicate conversations by other user's email or ID (no duplicate contacts)
    const uniqueMap = new Map();
    (conversations || []).forEach((conv) => {
      if (!conv || !conv.user) return;
      const key = (conv.user.email || conv.user.id || conv.id).toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, conv);
      } else {
        const existing = uniqueMap.get(key);
        // Prefer the one with latest message/activity
        const convTime = conv.lastActivity || 0;
        const existTime = existing.lastActivity || 0;
        if (convTime >= existTime || (conv.messages?.length || 0) > (existing.messages?.length || 0)) {
          uniqueMap.set(key, {
            ...conv,
            pinned: existing.pinned || conv.pinned,
            unreadCount: Math.max(existing.unreadCount || 0, conv.unreadCount || 0),
          });
        }
      }
    });

    const uniqueList = Array.from(uniqueMap.values());

    return uniqueList.filter((conv) => {
      // Filter by category/status
      if (activeFilter === 'Unread' && conv.unreadCount === 0) {
        return false;
      }
      if (activeFilter === 'Favorites' && !conv.pinned) {
        return false;
      }

      // Filter by search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = conv.user.name?.toLowerCase().includes(q);
      const emailMatch = conv.user.email ? conv.user.email.toLowerCase().includes(q) : false;
      const lastMsg = conv.messages[conv.messages.length - 1];
      const textMatch = lastMsg?.text?.toLowerCase().includes(q);
      const aboutMatch = conv.user.about?.toLowerCase().includes(q);

      return nameMatch || emailMatch || textMatch || aboutMatch;
    });
  }, [conversations, searchQuery, activeFilter]);

  // Sort: Pinned conversations always stay at top
  // Below pinned conversations, the chat with the most recent message is ALWAYS at the top!
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // 1. Pinned conversations always come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 2. Both pinned or both unpinned: most recent message / activity comes first
      const timeA = a.lastActivity || 0;
      const timeB = b.lastActivity || 0;
      return timeB - timeA;
    });
  }, [filteredConversations]);

  return (
    <aside className="w-full h-full flex flex-col min-h-0 bg-white/95">
      {/* 1. App Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-violet-100/70">
        <h1 className="font-black text-2xl tracking-tight bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-xs select-none">
          Bloom
        </h1>
        <button
          type="button"
          onClick={onOpenNewChat}
          className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 hover:text-violet-800 text-xs font-bold border border-violet-200 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          title="Start a new chat or add contact"
        >
          <UserPlus className="w-3.5 h-3.5 text-violet-600" />
          <span>New Chat</span>
        </button>
      </div>

      {/* 2. Search Bar */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-violet-500/70 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts, messages..."
            className="w-full bg-stone-50/90 pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all shadow-xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 px-0.5">
          {['All', 'Unread', 'Favorites'].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white shadow-sm shadow-violet-400/30'
                    : 'bg-white hover:bg-violet-50 text-stone-600 border border-stone-200 hover:border-violet-200'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Clean Conversation List (No Status/Camera Clutter inside) */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <p className="text-xs font-medium">No conversations found</p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-violet-600 font-semibold underline hover:text-violet-700"
              >
                Clear search
              </button>
            ) : (
              <button
                onClick={onOpenNewChat}
                className="mt-3 px-4 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Start Chat
              </button>
            )}
          </div>
        ) : (
          sortedConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const lastMsg = conv.messages[conv.messages.length - 1];
            const isOnline = conv.user.status === 'online';

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all duration-150 flex items-start gap-3 group ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-50 via-purple-50/50 to-white shadow-sm border border-violet-300'
                    : 'hover:bg-stone-50/90 border border-transparent hover:border-stone-200'
                }`}
              >
                {/* Contact Avatar + ONLY Green Online indicator */}
                <div className="relative flex-shrink-0 mt-0.5">
                  {conv.user.avatar ? (
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all shadow-xs">
                      {((conv.user.userId || conv.user.name || 'U')).replace(/^@/, '').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {/* Show indicator ONLY when contact is online */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs" />
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`text-sm truncate font-semibold ${
                          isSelected ? 'text-violet-950 font-bold' : 'text-stone-900'
                        }`}
                      >
                        @{((conv.user.userId || conv.user.name || conv.user.email?.split('@')[0] || '')).replace(/^@/, '')}
                      </span>
                      {/* Pin / Unpin Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin && onTogglePin(conv.id);
                        }}
                        className={`p-1 rounded-md transition-all cursor-pointer flex-shrink-0 ${
                          conv.pinned
                            ? 'text-violet-600 hover:text-rose-600 hover:bg-rose-50'
                            : 'opacity-0 group-hover:opacity-100 text-stone-400 hover:text-violet-600 hover:bg-violet-100/60'
                        }`}
                        title={conv.pinned ? 'Click to unpin chat' : 'Click to pin chat to top'}
                      >
                        {conv.pinned ? (
                          <Pin className="w-3.5 h-3.5 fill-violet-300" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Chat Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation && onDeleteConversation(conv.id, (conv.user.userId || conv.user.name || '').replace(/^@/, ''));
                        }}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex-shrink-0"
                        title={`Delete chat with @${((conv.user.userId || conv.user.name || '')).replace(/^@/, '')}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span
                      className={`text-[11px] whitespace-nowrap flex-shrink-0 font-medium ${
                        conv.unreadCount > 0 ? 'text-violet-700 font-bold' : 'text-stone-400'
                      }`}
                    >
                      {lastMsg?.timestamp?.split(', ')[0] || ''}
                    </span>
                  </div>

                  {/* Last Message Preview & Unread Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0
                          ? 'font-semibold text-stone-900'
                          : 'text-stone-500 group-hover:text-stone-700'
                      }`}
                    >
                      {lastMsg ? (
                        <span>
                          {lastMsg.senderId === currentUser.id && (
                            <span className="text-violet-700 font-semibold">You: </span>
                          )}
                          {lastMsg.text}
                        </span>
                      ) : (
                        <span className="italic text-stone-300">No messages yet</span>
                      )}
                    </p>

                    {/* Unread Counter Badge */}
                    {conv.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
