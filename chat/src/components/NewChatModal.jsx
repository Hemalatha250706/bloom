import React, { useState, useEffect } from 'react';
import { X, Search, Mail, UserPlus, Check, Sparkles, MessageSquare } from 'lucide-react';
import { chatService } from '../services/chatService.js';

export default function NewChatModal({ isOpen, onClose, onSelectUser, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      setError('');
    }
  }, [isOpen]);

  // Debounced search when user types email
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError('');
      try {
        const results = await chatService.searchUsersByEmail(q, currentUser?.id);
        // Exclude currently logged-in user from search results
        const myEmail = (currentUser?.email || '').toLowerCase().trim();
        const filtered = (results || []).filter(
          (u) =>
            u.id !== currentUser?.id &&
            u.email?.toLowerCase().trim() !== myEmail
        );
        setSearchResults(filtered);
        setHasSearched(true);
      } catch (err) {
        setError('Failed to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id, currentUser?.email]);

  if (!isOpen) return null;

  const handleSelect = (user) => {
    if (onSelectUser) {
      onSelectUser(user);
    }
    onClose();
  };

  // Allow initiating chat with raw email if exact match isn't in profiles yet
  const handleDirectEmailConnect = (e) => {
    e.preventDefault();
    const cleanEmail = searchQuery.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (cleanEmail === (currentUser?.email || '').toLowerCase().trim()) {
      setError('You cannot start a chat with yourself.');
      return;
    }

    const defaultHandle = cleanEmail.split('@')[0];
    handleSelect({
      id: null,
      name: defaultHandle,
      userId: defaultHandle,
      email: cleanEmail,
      avatar_url: '',
      about: 'Available 🌸',
    });
  };

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
              <p className="text-xs text-violet-100">Find registered users by email address 🌸</p>
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
          <form onSubmit={handleDirectEmailConnect}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-violet-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered user by email..."
                className="w-full bg-stone-50 pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-700"
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
          {isSearching && (
            <div className="py-8 text-center text-xs text-stone-400 font-medium flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span>Searching Bloom users...</span>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1 mb-2">
                Registered Users Found ({searchResults.length})
              </p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="p-3 rounded-2xl border border-stone-100 hover:border-violet-200 bg-stone-50/50 hover:bg-violet-50/50 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all shadow-xs flex-shrink-0">
                        {((user.userId || user.username || user.name || 'U')).replace(/^@/, '').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 group-hover:text-violet-950 truncate">
                        @{((user.userId || user.username || user.name || user.email?.split('@')[0] || '')).replace(/^@/, '')}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      {user.about && (
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">
                          {user.about}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isSearching && hasSearched && searchResults.length === 0 && (
            <div className="py-8 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-800">No matching user found</p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                No user registered with "{searchQuery}". You can invite them or connect directly.
              </p>
              {searchQuery.includes('@') && (
                <button
                  type="button"
                  onClick={handleDirectEmailConnect}
                  className="mt-4 px-4 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Start Chat with {searchQuery.trim()}</span>
                </button>
              )}
            </div>
          )}

          {!searchQuery && !hasSearched && (
            <div className="py-10 text-center px-6 text-stone-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-violet-300" />
              <p className="text-xs font-medium text-stone-500">
                Type an email address above to find your friends on Bloom.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
