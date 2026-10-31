import React, { useState, useEffect } from 'react';
import { X, Send, ChevronLeft, ChevronRight, Eye, Heart } from 'lucide-react';

export default function StatusViewerModal({
  statusData,
  currentUser,
  onClose,
  onReplyStatus,
  onLikeStatus,
  onViewStory,
}) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const stories = statusData?.stories || [];
  const currentStory = stories[currentStoryIndex];

  const myEmail = currentUser?.email?.toLowerCase().trim();
  const statusOwnerEmail = statusData?.userEmail?.toLowerCase().trim();
  const isMyStatus =
    statusOwnerEmail === myEmail ||
    statusData?.userId === currentUser?.id ||
    statusData?.id?.startsWith('status-me');

  const viewers = currentStory?.viewers || statusData?.viewers || [];
  const viewsCount = viewers.length;
  const baseLikesCount = currentStory?.likesCount || statusData?.likesCount || 0;
  const currentLikesCount = baseLikesCount + (isLiked ? 1 : 0);

  // Trigger view event for contacts' statuses
  useEffect(() => {
    if (!isMyStatus && statusData && currentStory && typeof onViewStory === 'function') {
      onViewStory(statusData.id, currentStory.id);
    }
  }, [statusData?.id, currentStory?.id, isMyStatus]);

  // Auto-advance progress timer (5 seconds) - pause when viewers sheet is open
  useEffect(() => {
    if (!statusData || stories.length === 0 || showViewersSheet) return;

    setProgress(0);
    const intervalTime = 50; // update every 50ms
    const totalDuration = 5000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex((i) => i + 1);
            setIsLiked(false);
            return 0;
          } else {
            clearInterval(timer);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [statusData, currentStoryIndex, stories.length, showViewersSheet, onClose]);

  // Keyboard navigation (arrows & Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
      if (e.key === 'Escape') {
        if (showViewersSheet) setShowViewersSheet(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStoryIndex, stories.length, showViewersSheet]);

  if (!statusData || !currentStory) return null;

  const handleNext = () => {
    if (showViewersSheet) setShowViewersSheet(false);
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
      setProgress(0);
      setIsLiked(false);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (showViewersSheet) setShowViewersSheet(false);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
      setProgress(0);
      setIsLiked(false);
    }
  };

  const handleToggleLike = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    if (nextLiked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
      if (typeof onLikeStatus === 'function') {
        onLikeStatus(statusData.id, currentStory.id);
      }
      if (onReplyStatus && (statusData?.userEmail || statusData?.userId)) {
        onReplyStatus(statusData.userEmail || statusData.userId, '❤️ Liked your status');
      }
    }
  };

  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim()) return;
    if (onReplyStatus && (statusData?.userEmail || statusData?.userId)) {
      onReplyStatus(statusData.userEmail || statusData.userId, replyText.trim());
      setReplyText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Click to close on backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Story Container (Mobile phone aspect ratio) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm h-[88vh] max-h-[720px] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col justify-between z-10"
      >
        {/* Progress Bars (one segment per story in user collection) */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {stories.map((story, idx) => (
            <div
              key={story.id || idx}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-xs"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{
                  width:
                    idx < currentStoryIndex
                      ? '100%'
                      : idx === currentStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header (Author, timestamp, close) */}
        <div className="relative z-30 pt-6 px-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full ring-2 ring-violet-500 overflow-hidden bg-white/10 flex-shrink-0">
              {statusData.userAvatar ? (
                <img
                  src={statusData.userAvatar}
                  alt={statusData.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                  {statusData.userName?.slice(0, 2).toUpperCase() || 'ST'}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-xs text-white leading-tight drop-shadow-xs">
                {statusData.userName}
              </h3>
              <p className="text-[10px] text-white/70 drop-shadow-xs">
                {currentStory.createdAt || statusData.timestamp || 'Just now'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Content: Photo or Text Status */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {currentStory.type === 'text' ? (
            /* Text Story */
            <div
              className={`w-full h-full flex items-center justify-center p-6 text-center text-white ${
                currentStory.background ||
                'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600'
              }`}
            >
              <p className="text-xl sm:text-2xl font-extrabold leading-snug drop-shadow-md max-w-[280px]">
                {currentStory.text}
              </p>
            </div>
          ) : (
            /* Photo Story */
            <div className="w-full h-full flex items-center justify-center bg-black">
              <img
                src={currentStory.url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Heart Burst Animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35 animate-in zoom-in-50 fade-in duration-200">
              <div className="text-7xl animate-bounce drop-shadow-2xl">❤️</div>
            </div>
          )}

          {/* Touch / Click Tap Zones for Story Navigation */}
          <button
            onClick={handlePrev}
            className="absolute left-0 inset-y-16 w-1/3 z-20 opacity-0 cursor-default"
            title="Previous story"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 inset-y-16 w-1/3 z-20 opacity-0 cursor-default"
            title="Next story"
          />
        </div>

        {/* Story Footer & Caption */}
        <div className="relative z-30 p-3 pt-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2">
          {currentStory.caption && (
            <p className="text-xs text-white font-medium text-center drop-shadow-xs px-2">
              {currentStory.caption}
            </p>
          )}

          {/* Interaction Bar */}
          {isMyStatus ? (
            /* My Status: Real Views Option Card */
            <button
              type="button"
              onClick={() => setShowViewersSheet(true)}
              className="w-full py-2 px-3 rounded-full bg-stone-900/90 hover:bg-stone-800 text-white flex items-center justify-between border border-stone-700/80 backdrop-blur-md transition-all cursor-pointer shadow-lg group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold group-hover:text-violet-300 transition-colors">
                  {viewsCount} {viewsCount === 1 ? 'View' : 'Views'}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 group-hover:text-stone-300">
                Tap to see who viewed ➔
              </span>
            </button>
          ) : (
            /* Contact's Status: Reply Input + Like Button */
            <div className="flex items-center gap-2">
              <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to status..."
                  className="flex-1 bg-stone-900/90 border border-stone-700 focus:border-violet-400 rounded-full py-1.5 px-3 text-xs text-white placeholder:text-stone-400 focus:outline-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    replyText.trim()
                      ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                  title="Send reply"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </form>

              {/* Like Option Button (Heart) */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                    : 'bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-rose-400 hover:border-rose-400'
                }`}
                title={isLiked ? 'Unlike status' : 'Like status (Send ❤️)'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-white text-white' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Views Sheet Popover (Slide up from bottom - ONLY for My Status) */}
        {isMyStatus && showViewersSheet && (
          <div className="absolute inset-x-0 bottom-0 top-16 z-40 bg-stone-950/95 backdrop-blur-md rounded-t-3xl border-t border-violet-900/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-3.5 px-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-violet-400" />
                <h4 className="font-bold text-sm text-white">
                  Viewed by {viewsCount} {viewsCount === 1 ? 'person' : 'people'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowViewersSheet(false)}
                className="w-7 h-7 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewers List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {viewers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-stone-400">
                  <Eye className="w-8 h-8 text-stone-600 mb-2" />
                  <p className="text-xs font-semibold text-stone-300">No views yet</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    When contacts open your status, their names will appear here.
                  </p>
                </div>
              ) : (
                viewers.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {v.avatar ? (
                        <img
                          src={v.avatar}
                          alt={v.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-violet-500/50"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                          {v.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-white">{v.name}</p>
                        <p className="text-[10px] text-stone-400">{v.time || 'Recently'}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-violet-400 font-medium">Seen</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
