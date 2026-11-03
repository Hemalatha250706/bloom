import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Smile, Heart, Plus, X, FileText, Pin } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import HDEmoji, { renderHDText } from './HDEmoji';

// Top popular quick reaction emojis as requested
const QUICK_REACTION_EMOJIS = [
  '❤️',
  '👍',
  '😂',
  '😮',
  '😢',
  '🔥',
  '🌸',
  '✨',
];

export default function MessageItem({
  message,
  isSender,
  senderUser,
  currentUser,
  isPinned = false,
  onAddReaction,
  onRemoveReaction,
  onTogglePinMessage,
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showDeleteReactionConfirm, setShowDeleteReactionConfirm] = useState(false);
  const [reactionToDelete, setReactionToDelete] = useState(null);
  const containerRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowReactionPicker(false);
        setShowFullPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current user's reaction on this message
  const myUserId = currentUser?.id;
  const reactionsList = Array.isArray(message.reactions) ? message.reactions : [];

  // Find if current user has an existing reaction
  const myReactionEntry = reactionsList.find(
    (r) => (r.userId && r.userId === myUserId) || (r.user_id && r.user_id === myUserId)
  );
  const myCurrentReaction =
    myReactionEntry?.emoji ||
    (message.reaction && isSender ? message.reaction : message.userReaction || null);

  // Group reactions for display
  const reactionsGrouped = [];
  if (reactionsList.length > 0) {
    const counts = {};
    reactionsList.forEach((r) => {
      if (!r.emoji) return;
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    Object.keys(counts).forEach((emoji) => {
      reactionsGrouped.push({
        emoji,
        count: counts[emoji],
        isMyReaction: myCurrentReaction === emoji,
      });
    });
  } else if (message.reaction) {
    reactionsGrouped.push({
      emoji: message.reaction,
      count: 1,
      isMyReaction: true,
    });
  }

  const handleSelectReaction = (emoji) => {
    if (emoji === myCurrentReaction) {
      // User tapped their existing reaction: show confirmation popup to delete
      setReactionToDelete(emoji);
      setShowDeleteReactionConfirm(true);
    } else if (onAddReaction) {
      // User chose a different emoji: update existing reaction without duplicate
      onAddReaction(message.id, emoji);
    }
    setShowReactionPicker(false);
    setShowFullPicker(false);
  };

  return (
    <div
      className={`group relative flex flex-col mb-4 transition-all duration-150 ${
        isSender ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex items-end gap-2.5 ${
          isSender ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Contact avatar for received messages */}
        {!isSender && (
          senderUser?.avatar ? (
            <img
              src={senderUser.avatar}
              alt={senderUser?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-200 mb-1 flex-shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-violet-200 mb-1 flex-shrink-0 shadow-xs">
              {senderUser?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          )
        )}

        {/* Message Bubble Container */}
        <div className="relative" ref={containerRef}>
          <div
            className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed transition-all ${
              isSender
                ? 'bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 text-white shadow-md shadow-violet-400/20 rounded-br-xs'
                : 'bg-white text-stone-800 border border-violet-100 shadow-sm rounded-bl-xs hover:border-violet-200'
            }`}
          >
            {/* Pinned Tag Indicator */}
            {isPinned && (
              <div
                className={`flex items-center gap-1 text-[10px] font-bold mb-1 ${
                  isSender ? 'text-violet-200' : 'text-violet-700'
                }`}
              >
                <Pin className="w-3 h-3 fill-current" />
                <span>Pinned</span>
              </div>
            )}
            {/* If message has an image attachment */}
            {message.attachment?.type === 'image' && (
              <div className="mb-2 overflow-hidden rounded-xl max-w-xs">
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name || 'Shared photo'}
                  className="w-full max-h-72 object-cover rounded-xl shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(message.attachment.url, '_blank')}
                  title="Click to view full photo"
                />
              </div>
            )}

            {/* If message has a document / file attachment */}
            {message.attachment?.type === 'file' && (
              <div
                className={`mb-2 flex items-center gap-2.5 p-2.5 rounded-xl border ${
                  isSender
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-violet-50/80 border-violet-200 text-stone-800'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSender
                      ? 'bg-white/30 text-white'
                      : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-bold truncate">
                    {message.attachment.name}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isSender ? 'text-violet-100' : 'text-stone-500'
                    }`}
                  >
                    {message.attachment.size || 'Document'}
                  </p>
                </div>
              </div>
            )}

            {/* Message Text with HD Apple Emojis (if text is present) */}
            {message.text && (
              <div className="whitespace-pre-wrap break-words font-medium">
                {renderHDText(message.text, 22)}
              </div>
            )}

            {/* Timestamp & Status Metadata */}
            <div
              className={`flex items-center gap-1.5 mt-1 text-[11px] select-none ${
                isSender ? 'justify-end text-violet-100' : 'justify-start text-stone-400'
              }`}
            >
              <span>{message.timestamp}</span>
              {isSender && (
                <span className="inline-flex items-center ml-1 select-none">
                  {message.status === 'read' ? (
                    <CheckCheck
                      className="w-4 h-4 text-sky-300 stroke-[2.5] drop-shadow-xs"
                      title="Read (Double blue ticks)"
                    />
                  ) : message.status === 'delivered' ? (
                    <CheckCheck
                      className="w-4 h-4 text-white/60 stroke-[1.8]"
                      title="Delivered (Double grey ticks)"
                    />
                  ) : (
                    <Check
                      className="w-4 h-4 text-white/60 stroke-[1.8]"
                      title="Sent (Single grey tick)"
                    />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Reaction Badges below the message */}
          {reactionsGrouped.length > 0 && (
            <div
              className={`absolute -bottom-3 ${
                isSender ? 'right-2' : 'left-2'
              } flex items-center gap-1 z-10 flex-wrap`}
            >
              {reactionsGrouped.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => {
                    if (item.isMyReaction || myCurrentReaction === item.emoji) {
                      // Clicked user's already-added reaction -> show confirmation popup to remove
                      setReactionToDelete(item.emoji);
                      setShowDeleteReactionConfirm(true);
                    } else {
                      // Clicked another user's reaction -> react with same emoji
                      handleSelectReaction(item.emoji);
                    }
                  }}
                  title={
                    item.isMyReaction
                      ? 'Click to remove your reaction'
                      : `React with ${item.emoji}`
                  }
                  className={`px-2 py-0.5 rounded-full bg-white border text-xs shadow-md flex items-center gap-1 hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                    item.isMyReaction
                      ? 'border-violet-400 bg-violet-50/70 ring-1 ring-violet-300'
                      : 'border-violet-200'
                  }`}
                >
                  <HDEmoji emoji={item.emoji} size={15} />
                  {item.count > 1 && (
                    <span className="text-[10px] font-bold text-stone-600">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Hover Like, reaction and pin trigger buttons */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 z-10 ${
              isSender ? '-left-24' : '-right-24'
            }`}
          >
            {/* Quick Like Button (❤️) */}
            <button
              type="button"
              onClick={() => {
                if (myCurrentReaction === '❤️') {
                  setReactionToDelete('❤️');
                  setShowDeleteReactionConfirm(true);
                } else {
                  handleSelectReaction('❤️');
                }
              }}
              className={`w-7 h-7 rounded-full bg-white hover:bg-rose-50 border border-violet-200 flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                myCurrentReaction === '❤️'
                  ? 'text-rose-500 bg-rose-50 ring-2 ring-rose-200'
                  : 'text-stone-400 hover:text-rose-500'
              }`}
              title={myCurrentReaction === '❤️' ? 'Remove Like' : 'Like (❤️)'}
            >
              <Heart className={`w-3.5 h-3.5 ${myCurrentReaction === '❤️' ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Reaction Picker Button */}
            <button
              type="button"
              onClick={() => {
                setShowReactionPicker(!showReactionPicker);
                setShowFullPicker(false);
              }}
              className="w-7 h-7 rounded-full bg-white hover:bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="React with emojis"
            >
              <Smile className="w-4 h-4 text-violet-500" />
            </button>

            {/* Pin Message Button */}
            <button
              type="button"
              onClick={() => onTogglePinMessage && onTogglePinMessage(message.id)}
              className={`w-7 h-7 rounded-full bg-white hover:bg-violet-50 border border-violet-200 flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
                isPinned
                  ? 'text-violet-700 bg-violet-100 ring-2 ring-violet-300'
                  : 'text-stone-400 hover:text-violet-600'
              }`}
              title={isPinned ? 'Unpin message' : 'Pin message to top'}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-violet-500 text-violet-700' : ''}`} />
            </button>
          </div>

          {/* Quick Reaction Picker Popover with HD Emojis & Plus Button */}
          {showReactionPicker && (
            <div
              className={`absolute bottom-full mb-1.5 z-30 flex items-center gap-1 p-1 bg-white border border-violet-200 rounded-full shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                isSender ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelectReaction(emoji)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-violet-100 flex items-center justify-center transition-transform hover:scale-125 p-1 cursor-pointer"
                  title={`React with ${emoji}`}
                >
                  <HDEmoji emoji={emoji} size={20} />
                </button>
              ))}

              {/* Plus Button to Open Full Emoji Picker for ANY Emoji! */}
              <button
                type="button"
                onClick={() => setShowFullPicker((prev) => !prev)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  showFullPicker
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100 hover:scale-110'
                }`}
                title="Choose any emoji (+)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Full Apple HD Emoji Picker Popover for ANY Emoji */}
          {showFullPicker && (
            <div
              className={`absolute bottom-full mb-11 z-40 shadow-2xl rounded-2xl overflow-hidden border border-violet-200 bg-white animate-in fade-in zoom-in-95 duration-150 ${
                isSender ? 'right-0' : 'left-0'
              }`}
              style={{ width: '310px' }}
            >
              <div className="px-3 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 flex items-center justify-between">
                <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-violet-600" />
                  React with any emoji
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullPicker(false)}
                  className="w-5 h-5 rounded-full hover:bg-violet-200/60 flex items-center justify-center text-stone-500 hover:text-stone-800 cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <EmojiPicker
                onEmojiClick={(emojiData) => handleSelectReaction(emojiData.emoji)}
                autoFocusSearch={false}
                theme={Theme.LIGHT}
                emojiStyle={EmojiStyle.APPLE}
                searchPlaceHolder="Search all emojis..."
                width={310}
                height={350}
                lazyLoadEmojis={true}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Remove Reaction Confirmation Modal */}
      {showDeleteReactionConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteReactionConfirm(false);
          }}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-violet-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-3">
              <HDEmoji
                emoji={reactionToDelete || myCurrentReaction || message.reaction || '❤️'}
                size={24}
              />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Remove Reaction?
            </h3>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              Are you sure you want to remove your reaction?
            </p>
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteReactionConfirm(false);
                  setReactionToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRemoveReaction) {
                    onRemoveReaction(
                      message.id,
                      reactionToDelete || myCurrentReaction || message.reaction
                    );
                  }
                  setShowDeleteReactionConfirm(false);
                  setReactionToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
