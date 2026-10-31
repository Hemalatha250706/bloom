import React from 'react';
import { MessageSquare, Sparkles, Coffee, Heart, Zap } from 'lucide-react';

export default function EmptyState({ onSelectFirstChat, onOpenNewChat }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white via-violet-50/25 to-purple-50/30">
      <div className="relative mb-6">
        {/* Soft decorative glow */}
        <div className="absolute -inset-6 bg-gradient-to-tr from-violet-300/40 via-purple-300/30 to-indigo-300/40 rounded-full blur-2xl opacity-75 animate-pulse" />
        
        {/* Friendly Illustration Container */}
        <div className="relative w-40 h-40 rounded-3xl bg-white border-2 border-violet-100 shadow-xl flex items-center justify-center p-6">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Luminous circular backdrop */}
            <circle cx="80" cy="80" r="64" fill="#F5F3FF" />
            
            {/* Left speech bubble - Vibrant Lavender */}
            <rect
              x="26"
              y="42"
              width="72"
              height="46"
              rx="20"
              fill="#EDE9FE"
              stroke="#A78BFA"
              strokeWidth="2.5"
            />
            {/* Lavender bubble tail */}
            <path
              d="M36 88 L28 102 L48 88 Z"
              fill="#EDE9FE"
              stroke="#A78BFA"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Colorful dots in left bubble */}
            <circle cx="48" cy="65" r="4.5" fill="#8B5CF6" />
            <circle cx="62" cy="65" r="4.5" fill="#A78BFA" />
            <circle cx="76" cy="65" r="4.5" fill="#C4B5FD" />

            {/* Right speech bubble - Soft Rose Cream */}
            <rect
              x="68"
              y="72"
              width="68"
              height="44"
              rx="20"
              fill="#FAF5FF"
              stroke="#C084FC"
              strokeWidth="2.5"
            />
            {/* Peach/Rose bubble tail */}
            <path
              d="M122 116 L130 126 L114 116 Z"
              fill="#FAF5FF"
              stroke="#C084FC"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Heart in right bubble */}
            <path
              d="M102 88 C102 84 97 82 94 85 C91 82 86 84 86 88 C86 94 94 99 94 99 C94 99 102 94 102 88 Z"
              fill="#A855F7"
            />

            {/* Little plant sprout in bottom center */}
            <path
              d="M77 138 C77 130 70 124 64 124 C64 130 70 138 77 138 Z"
              fill="#C084FC"
            />
            <path
              d="M83 138 C83 128 90 122 96 123 C96 130 90 138 83 138 Z"
              fill="#8B5CF6"
            />
            <line x1="80" y1="128" x2="80" y2="142" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          </svg>

          {/* Floating badge */}
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-500 border-2 border-white flex items-center justify-center text-white shadow-md animate-bounce">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-stone-900 mb-2 tracking-tight">
        Welcome to Bloom
      </h2>
      <p className="text-stone-600 text-sm max-w-sm mb-6 leading-relaxed font-medium">
        Select a conversation from the sidebar to start chatting in a calm, soothing lavender space.
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onSelectFirstChat && (
          <button
            onClick={onSelectFirstChat}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 shadow-violet-400/30 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Conversation</span>
          </button>
        )}
        {onOpenNewChat && (
          <button
            onClick={onOpenNewChat}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-violet-700 bg-violet-100 hover:bg-violet-200 font-bold text-sm border border-violet-200 shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>Start a New Chat</span>
          </button>
        )}
      </div>

      {/* Feature highlights */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold border border-violet-200 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-violet-600" />
          Fast & Responsive
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 shadow-xs">
          <Coffee className="w-3.5 h-3.5 text-purple-600" />
          Lavender Aesthetic
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-xs font-bold border border-fuchsia-200 shadow-xs">
          <Heart className="w-3.5 h-3.5 text-fuchsia-600" />
          HD Emoji Collection
        </span>
      </div>
    </div>
  );
}
