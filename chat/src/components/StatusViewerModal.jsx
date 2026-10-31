import React, { useState, useEffect } from 'react';
import { X, Send, ChevronLeft, ChevronRight, Eye, Heart } from 'lucide-react';
import { MOCK_STATUS_VIEWERS } from '../data/mockStatus';

export default function StatusViewerModal({ statusData, currentUser, onClose, onReplyStatus }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const stories = statusData?.stories || [];
  const currentStory = stories[currentStoryIndex];

  const isMyStatus = statusData?.userId === currentUser?.id || statusData?.id?.startsWith('status-me');
  const baseViewsCount = currentStory?.viewsCount || statusData?.viewsCount || 24;
  const baseLikesCount = currentStory?.likesCount || statusData?.likesCount || 8;
  const currentLikesCount = baseLikesCount + (isLiked ? 1 : 0);

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
      if (onReplyStatus && statusData?.userId) {
        onReplyStatus(statusData.userId, '❤️ Liked your status');
      }
    }
  };

  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim()) return;
    if (onReplyStatus) {
      onReplyStatus(statusData.userId, `Replied to status: "${replyText.trim()}"`);
    }
    setReplyText('');
    onClose();
  };

  return (
    <div
      onWheel={(e) => {
        if (e.deltaY > 30 || e.deltaX > 30) {
          handleNext();
        } else if (e.deltaY < -30 || e.deltaX < -30) {
          handlePrev();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-150 select-none"
    >
      {/* Compact Modal Box */}
      <div className="relative w-full max-w-sm h-full sm:h-[82vh] sm:max-h-[600px] bg-stone-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-3 pt-4 z-20 bg-gradient-to-b from-stone-950/80 to-transparent flex flex-col gap-2">
          {/* Progress lines */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((s, idx) => (
              <div key={s.id || idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
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

          {/* User Header Info, Views Pill & Close Button */}
          <div className="flex items-center justify-between text-white mt-1">
            <div className="flex items-center gap-2.5">
              <img
                src={statusData.userAvatar}
                alt={statusData.userName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-400 shadow-md"
              />
              <div>
                <h4 className="font-bold text-xs sm:text-sm leading-tight text-white drop-shadow-xs">
                  {statusData.userName}
                </h4>
                <p className="text-[10px] text-stone-300 font-medium">
                  {currentStory.createdAt || statusData.timestamp}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick Views Pill in header ONLY for My Status */}
              {isMyStatus && (
                <button
                  type="button"
                  onClick={() => setShowViewersSheet(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-900/60 hover:bg-stone-800 text-stone-200 text-[11px] font-medium backdrop-blur-md transition-colors cursor-pointer border border-stone-700/60"
                  title="View seen list"
                >
                  <Eye className="w-3.5 h-3.5 text-violet-300" />
                  <span>{baseViewsCount} views</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-stone-900/60 hover:bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-stone-700/60"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Media / Content Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {currentStory.type === 'text' ? (
            /* Text status card */
            <div
              className={`w-full h-full flex items-center justify-center p-6 text-center text-white ${
                currentStory.background || 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600'
              }`}
            >
              <p className="text-xl sm:text-2xl font-extrabold leading-snug drop-shadow-md">
                {currentStory.text}
              </p>
            </div>
          ) : (
            /* Image status */
            <img
              src={currentStory.url}
              alt="Status"
              className="w-full h-full object-cover sm:object-contain select-none"
            />
          )}

          {/* Floating Heart Burst Animation on Like */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 fade-out duration-700">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-bounce" />
            </div>
          )}

          {/* Touch/click hit-areas for Prev / Next */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer focus:outline-none"
            title="Previous"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-20 w-2/3 z-10 cursor-pointer focus:outline-none"
            title="Next"
          />

          {/* Navigation Arrows for desktop */}
          {currentStoryIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center z-20 transition-colors hidden sm:flex cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {currentStoryIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center z-20 transition-colors hidden sm:flex cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Bar: Caption, Reply, Views & Like Option */}
        <div className="p-3 bg-gradient-to-t from-stone-950 via-stone-950/85 to-transparent z-20 flex flex-col gap-2">
          {/* Caption text */}
          {currentStory.caption && (
            <p className="text-xs text-white font-medium text-center drop-shadow-xs px-2">
              {currentStory.caption}
            </p>
          )}

          {/* Interaction Bar */}
          {isMyStatus ? (
            /* My Status: Views Option Card */
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
                  {baseViewsCount} Views
                </span>
              </div>
              <span className="text-[11px] text-stone-400 group-hover:text-stone-300">
                Tap to see who viewed ➔
              </span>
            </button>
          ) : (
            /* Contact's Status: Reply Input + Like Button (NO views shown for contacts) */
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
                  Viewed by {baseViewsCount} people
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
              {MOCK_STATUS_VIEWERS.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-900/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={v.avatar}
                      alt={v.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-violet-500/50"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{v.name}</p>
                      <p className="text-[10px] text-stone-400">{v.time}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-violet-400 font-medium">Seen</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
