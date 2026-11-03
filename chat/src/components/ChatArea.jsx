import React, { useEffect, useRef } from 'react';
import { Pin, X } from 'lucide-react';
import MessageItem from './MessageItem';

export default function ChatArea({
  conversation,
  currentUser,
  isTyping,
  onAddReaction,
  onRemoveReaction,
  onTogglePinMessage,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on messages update or conversation switch
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isTyping]);

  if (!conversation) return null;

  const pinnedMessage = conversation.pinnedMessageId
    ? conversation.messages.find((m) => m.id === conversation.pinnedMessageId)
    : null;

  // Group messages by date
  const messagesByDate = conversation.messages.reduce((acc, msg) => {
    const dateKey = msg.date || 'Today';
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-violet-50/20 via-white/80 to-purple-50/20 relative"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Pinned Message Banner at the Top of the Chat Box */}
        {pinnedMessage && (
          <div className="sticky top-0 z-20 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-violet-200/90 shadow-md shadow-violet-500/5 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-150">
            <div
              onClick={() => {
                const el = document.getElementById(`msg-${pinnedMessage.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="flex items-center gap-2.5 cursor-pointer truncate mr-2 group"
              title="Click to jump to this message"
            >
              <div className="w-7 h-7 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                <Pin className="w-3.5 h-3.5 fill-violet-400" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-violet-700">
                  Pinned Message
                </span>
                <span className="block text-xs font-semibold text-stone-800 truncate group-hover:text-violet-950 transition-colors">
                  {pinnedMessage.text || (pinnedMessage.attachment ? 'Shared attachment' : '')}
                </span>
              </div>
            </div>
            <button
              onClick={() => onTogglePinMessage && onTogglePinMessage(pinnedMessage.id)}
              className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Unpin message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {Object.entries(messagesByDate).map(([date, msgs]) => (
          <div key={date} className="space-y-3">
            {/* Date Separator Pill */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white text-violet-800 border border-violet-200/90 shadow-xs">
                {date}
              </span>
            </div>

            {/* List of Messages */}
            {msgs.map((msg) => {
              const myEmail = (currentUser?.email || '').toLowerCase().trim();
              const myUserId = (
                currentUser?.userId ||
                currentUser?.username ||
                currentUser?.user_metadata?.username ||
                currentUser?.user_metadata?.userId ||
                ''
              ).toLowerCase().trim().replace(/^@/, '');
              const myName = (currentUser?.name || '').toLowerCase().trim();

              const msgSenderId = String(msg.senderId || '').toLowerCase().trim();
              const currentUserId = String(currentUser?.id || '').toLowerCase().trim();
              const msgSenderEmail = (msg.senderEmail || '').toLowerCase().trim();
              const msgSenderUserId = (msg.senderUserId || '').toLowerCase().trim().replace(/^@/, '');
              const msgSenderName = (msg.senderName || '').toLowerCase().trim();

              const isSender =
                (msgSenderId && currentUserId && msgSenderId === currentUserId) ||
                (msgSenderEmail && myEmail && msgSenderEmail === myEmail) ||
                (msgSenderUserId && myUserId && msgSenderUserId === myUserId) ||
                (msgSenderName && myName && msgSenderName === myName && msg.id.startsWith('msg-'));

              return (
                <div key={msg.id} id={`msg-${msg.id}`}>
                  <MessageItem
                    message={msg}
                    isSender={isSender}
                    senderUser={conversation.user}
                    currentUser={currentUser}
                    isPinned={msg.id === conversation.pinnedMessageId}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    onTogglePinMessage={onTogglePinMessage}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Offline notice when contact is offline */}
        {conversation?.user?.status !== 'online' && (
          <div className="flex items-center justify-center pt-2 pb-1">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-500 border border-stone-200 shadow-2xs">
              {conversation?.user?.name || 'Contact'} is currently offline. Messages will be delivered when online.
            </span>
          </div>
        )}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex items-center gap-2.5 mb-3">
            {conversation.user.avatar ? (
              <img
                src={conversation.user.avatar}
                alt={conversation.user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-200 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-violet-200 shadow-xs">
                {conversation.user.name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div className="px-4 py-3 rounded-2xl rounded-bl-xs bg-white border border-violet-100 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
