import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { formatStatusTime, formatViewedTime } from '../services/chatService.js';

export default function StatusViewerModal({
  statusData,
  currentUser,
  onClose,
  onReplyStatus,
  onLikeStatus,
  onCommentStatus,
  onViewStory,
}) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [activityTab, setActivityTab] = useState('views'); // 'views' | 'likes' | 'comments'
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const stories = statusData?.stories || [];
  const currentStory = stories[currentStoryIndex];

  const myEmail = currentUser?.email?.toLowerCase().trim();
  const myId = currentUser?.id;
  const statusOwnerEmail = statusData?.userEmail?.toLowerCase().trim();
  const isMyStatus =
    statusOwnerEmail === myEmail ||
    statusData?.userId === myId ||
    statusData?.id?.startsWith('status-me');

  const viewers = currentStory?.viewers || [];
  const likes = currentStory?.likes || [];
  const comments = currentStory?.comments || [];

  const viewsCount = viewers.length;
  const likesCount = likes.length;
  const commentsCount = comments.length;

  const hasUserLiked = likes.some(
    (l) => (myEmail && l.email?.toLowerCase() === myEmail) || (myId && l.userId === myId)
  );

  const [isLiked, setIsLiked] = useState(hasUserLiked);

  useEffect(() => {
    setIsLiked(hasUserLiked);
  }, [currentStoryIndex, hasUserLiked]);

  // Trigger view event for contacts' statuses
  useEffect(() => {
    if (!isMyStatus && statusData && currentStory && typeof onViewStory === 'function') {
      onViewStory(statusData.id, currentStory.id);
    }
  }, [statusData?.id, currentStory?.id, isMyStatus]);

  // Auto-advance progress timer (5 seconds) - paused when activity sheet is open
  useEffect(() => {
    if (!statusData || stories.length === 0 || showActivitySheet) return;

    setProgress(0);
    const intervalTime = 50;
    const totalDuration = 5000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex((i) => i + 1);
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
  }, [statusData, currentStoryIndex, stories.length, showActivitySheet, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
      if (e.key === 'Escape') {
        if (showActivitySheet) setShowActivitySheet(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStoryIndex, stories.length, showActivitySheet]);

  if (!statusData || !currentStory) return null;

  const handleNext = () => {
    if (showActivitySheet) setShowActivitySheet(false);
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (showActivitySheet) setShowActivitySheet(false);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
      setProgress(0);
    }
  };

  // Like / Unlike handler
  const handleToggleLike = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    if (nextLiked) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }

    if (typeof onLikeStatus === 'function') {
      onLikeStatus(statusData.id, currentStory.id);
    }

    if (nextLiked && onReplyStatus && (statusData?.userEmail || statusData?.userId)) {
      onReplyStatus(statusData.userEmail || statusData.userId, '❤️ Liked your status');
    }
  };

  // Comment / Reply handler
  const handleSendComment = (e) => {
    e?.preventDefault();
    const text = replyText.trim();
    if (!text) return;

    if (typeof onCommentStatus === 'function') {
      onCommentStatus(
        statusData.id,
        currentStory.id,
        text,
        statusData.userEmail || statusData.userId
      );
    } else if (onReplyStatus && (statusData?.userEmail || statusData?.userId)) {
      onReplyStatus(statusData.userEmail || statusData.userId, text);
    }

    setReplyText('');
    setToastMessage('Comment sent! 🌸');
    setTimeout(() => setToastMessage(''), 2200);
  };

  const storyTimestamp =
    currentStory.createdAt ||
    currentStory.timestamp ||
    (currentStory.id && currentStory.id.match(/\d{13}/)?.[0] ? parseInt(currentStory.id.match(/\d{13}/)[0], 10) : null) ||
    statusData.timestamp ||
    (statusData.id && statusData.id.match(/\d{13}/)?.[0] ? parseInt(statusData.id.match(/\d{13}/)[0], 10) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Click to close on backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Story Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm h-[88vh] max-h-[720px] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col justify-between z-10"
      >
        {/* Progress Bars */}
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

        {/* Story Header */}
        <div className="relative z-30 pt-6 px-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/45 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full ring-2 ring-violet-500 overflow-hidden bg-white/10 flex-shrink-0 shadow-md">
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
              <p className="text-[10px] text-white/80 drop-shadow-xs font-medium">
                {formatStatusTime(storyTimestamp)}
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

        {/* Floating Badges for Story Likes and Comments */}
        <div className="absolute top-16 right-3 z-30 flex flex-col gap-2">
          {likesCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActivityTab('likes');
                setShowActivitySheet(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-rose-500/40 shadow-lg cursor-pointer transition-all active:scale-95"
              title={`${likesCount} Likes`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{likesCount}</span>
            </button>
          )}

          {commentsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActivityTab('comments');
                setShowActivitySheet(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-violet-500/40 shadow-lg cursor-pointer transition-all active:scale-95"
              title={`${commentsCount} Comments`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span>{commentsCount}</span>
            </button>
          )}
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

          {/* Toast Message Notification */}
          {toastMessage && (
            <div className="absolute top-20 inset-x-0 flex justify-center z-40 pointer-events-none animate-in fade-in slide-in-from-top duration-150">
              <span className="px-3.5 py-1.5 rounded-full bg-violet-600/90 text-white text-xs font-bold shadow-lg backdrop-blur-xs">
                {toastMessage}
              </span>
            </div>
          )}

          {/* Touch / Click Tap Zones */}
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
        <div className="relative z-30 p-3 pt-2 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2">
          {currentStory.caption && (
            <p className="text-xs text-white font-medium text-center drop-shadow-xs px-2">
              {currentStory.caption}
            </p>
          )}

          {/* Interaction Bar */}
          {isMyStatus ? (
            /* My Status: Combined Views, Likes, and Comments Option Bar */
            <button
              type="button"
              onClick={() => {
                setActivityTab('views');
                setShowActivitySheet(true);
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-white flex items-center justify-between border border-stone-700/80 backdrop-blur-md transition-all cursor-pointer shadow-lg group"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold group-hover:text-violet-300">
                  <Eye className="w-3.5 h-3.5 text-violet-400" />
                  {viewsCount} {viewsCount === 1 ? 'View' : 'Views'}
                </span>
                <span className="text-stone-600">•</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold group-hover:text-rose-300">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                </span>
                <span className="text-stone-600">•</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold group-hover:text-purple-300">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  {commentsCount}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 group-hover:text-stone-200 font-medium">
                Activity ➔
              </span>
            </button>
          ) : (
            /* Contact's Status: Comment Input + Like Button + View Activity */
            <div className="flex items-center gap-2">
              <form onSubmit={handleSendComment} className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Comment or reply to status..."
                  className="flex-1 bg-stone-900/90 border border-stone-700 focus:border-violet-400 rounded-full py-1.5 px-3.5 text-xs text-white placeholder:text-stone-400 focus:outline-none shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    replyText.trim()
                      ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md cursor-pointer active:scale-95'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                  title="Send comment"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </form>

              {/* View Comments Sheet Button */}
              {commentsCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActivityTab('comments');
                    setShowActivitySheet(true);
                  }}
                  className="w-8 h-8 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="View comments"
                >
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </button>
              )}

              {/* Like (Heart) Button */}
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

        {/* Activity Sheet Popover (Views, Likes, Comments) */}
        {showActivitySheet && (
          <div className="absolute inset-x-0 bottom-0 top-16 z-40 bg-stone-950/98 backdrop-blur-md rounded-t-3xl border-t border-violet-900/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header & Tabs */}
            <div className="p-3.5 px-4 border-b border-stone-800 flex items-center justify-between">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivityTab('views')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activityTab === 'views'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Views ({viewsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivityTab('likes')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activityTab === 'likes'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>Likes ({likesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivityTab('comments')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activityTab === 'comments'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Comments ({commentsCount})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowActivitySheet(false)}
                className="w-7 h-7 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {/* 1. VIEWS TAB */}
              {activityTab === 'views' && (
                viewers.length === 0 ? (
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
                      key={v.id || v.userId || idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 transition-colors"
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
                          <p className="text-[10px] text-stone-400">
                            {formatViewedTime(v.viewedAt || v.timestamp || (v.time && v.time !== 'Just now' ? v.time : null))}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-violet-400 font-semibold px-2 py-0.5 rounded-full bg-violet-950/60 border border-violet-800/40">
                        Seen
                      </span>
                    </div>
                  ))
                )
              )}

              {/* 2. LIKES TAB */}
              {activityTab === 'likes' && (
                likes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-stone-400">
                    <Heart className="w-8 h-8 text-stone-600 mb-2" />
                    <p className="text-xs font-semibold text-stone-300">No likes yet</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      When someone taps the heart icon, their like will appear here.
                    </p>
                  </div>
                ) : (
                  likes.map((l, idx) => (
                    <div
                      key={l.id || l.userId || idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-stone-900/50 hover:bg-stone-900 border border-stone-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {l.avatar ? (
                          <img
                            src={l.avatar}
                            alt={l.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-rose-500/50"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                            {l.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">{l.name}</p>
                          <p className="text-[10px] text-stone-400">{formatStatusTime(l.time || l.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/40">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>Liked</span>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* 3. COMMENTS TAB */}
              {activityTab === 'comments' && (
                comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-stone-400">
                    <MessageSquare className="w-8 h-8 text-stone-600 mb-2" />
                    <p className="text-xs font-semibold text-stone-300">No comments yet</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Comments and replies to this status update will appear here.
                    </p>
                  </div>
                ) : (
                  comments.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.name}
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-500/50"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                              {c.name?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-xs font-bold text-white">{c.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {formatStatusTime(c.time || c.timestamp)}
                        </span>
                      </div>
                      <div className="pl-8">
                        <p className="text-xs text-stone-200 bg-stone-950/80 p-2 rounded-lg border border-stone-800/60 leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
