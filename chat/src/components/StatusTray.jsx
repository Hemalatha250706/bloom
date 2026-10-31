import React from 'react';
import { Plus, Camera, Sparkles } from 'lucide-react';

export default function StatusTray({
  currentUser,
  myStatuses = [],
  contactStatuses = [],
  onOpenMyStatus,
  onCreateStatus,
  onOpenContactStatus,
  onOpenLiveCamera,
}) {
  const hasMyStatus = myStatuses.length > 0;

  return (
    <div className="py-2.5 px-3 border-b border-violet-100/70 bg-gradient-to-b from-white to-violet-50/20">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Status Updates</span>
        </span>

        {/* Quick Camera Snap Button */}
        <button
          onClick={onOpenLiveCamera}
          className="p-1 px-2 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-800 text-[10px] font-bold transition-colors flex items-center gap-1 shadow-xs"
          title="Open camera"
        >
          <Camera className="w-3 h-3 text-violet-600" />
          <span>Camera</span>
        </button>
      </div>

      {/* Horizontal Story Tray */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none pr-2">
        {/* 1. My Status Circle */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
          <div className="relative">
            {/* Avatar circle */}
            <div
              onClick={() => {
                if (hasMyStatus) {
                  onOpenMyStatus();
                } else {
                  onCreateStatus();
                }
              }}
              className={`w-13 h-13 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                hasMyStatus
                  ? 'bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-500 shadow-sm'
                  : 'bg-stone-200'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="My status"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-200 text-violet-800 font-bold text-xs flex items-center justify-center rounded-full">
                    {currentUser?.name?.slice(0, 2).toUpperCase() || 'ME'}
                  </div>
                )}
              </div>
            </div>

            {/* Plus badge to add status */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateStatus();
              }}
              className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-md ring-2 ring-white hover:scale-110 active:scale-95 transition-all"
              title="Add status update"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[10px] font-semibold text-stone-700 mt-1 max-w-[58px] truncate text-center">
            {hasMyStatus ? 'My Status' : 'Add Status'}
          </span>
        </div>

        {/* 2. Contacts Statuses */}
        {contactStatuses.map((st) => (
          <div
            key={st.id}
            onClick={() => onOpenContactStatus(st)}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
          >
            {/* Gradient glowing story ring */}
            <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-purple-500 shadow-sm transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                <img
                  src={st.userAvatar}
                  alt={st.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-stone-700 mt-1 max-w-[58px] truncate text-center">
              {st.userName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

