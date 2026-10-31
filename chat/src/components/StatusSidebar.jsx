import React, { useState } from 'react';
import { Plus, Camera, ChevronDown, ChevronRight, Eye, Sparkles } from 'lucide-react';

export default function StatusSidebar({
  currentUser,
  myStatuses = [],
  contactStatuses = [],
  viewedStatusIds = [],
  onOpenMyStatus,
  onCreateStatus,
  onOpenContactStatus,
  onOpenLiveCamera,
}) {
  const [showViewed, setShowViewed] = useState(true);
  const hasMyStatus = myStatuses.length > 0;
  const myTotalViews = myStatuses.reduce(
    (acc, st) => acc + (st.viewers?.length || 0),
    0
  );

  const recentStatuses = contactStatuses.filter(
    (st) => !viewedStatusIds.includes(st.id)
  );
  const viewedStatuses = contactStatuses.filter((st) =>
    viewedStatusIds.includes(st.id)
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-white/95 select-none">
      {/* 1. Header with Camera and Add Button */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-violet-100/70 flex-shrink-0">
        <div>
          <h2 className="font-extrabold text-lg text-stone-900 tracking-tight">
            Status
          </h2>
          <p className="text-[10px] text-stone-400 font-medium">Stories & Updates</p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Camera */}
          <button
            type="button"
            onClick={onOpenLiveCamera}
            className="p-1.5 rounded-xl hover:bg-violet-50 text-stone-500 hover:text-violet-700 transition-colors cursor-pointer"
            title="Take photo with camera"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Add Status */}
          <button
            type="button"
            onClick={onCreateStatus}
            className="p-1.5 rounded-xl bg-violet-100/80 hover:bg-violet-200 text-violet-800 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5 shadow-2xs cursor-pointer"
            title="Create status"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Add</span>
          </button>
        </div>
      </div>

      {/* 2. Scrollable Status List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 min-h-0">
        {/* My Status */}
        <div
          onClick={() => {
            if (hasMyStatus) onOpenMyStatus();
            else onCreateStatus();
          }}
          className="p-2.5 rounded-2xl hover:bg-violet-50/70 border border-violet-100/80 flex items-center gap-3 cursor-pointer transition-all shadow-2xs group"
          title={hasMyStatus ? 'Tap to view your status' : 'Tap to add status'}
        >
          <div className="relative flex-shrink-0">
            <div
              className={`w-11 h-11 rounded-full p-0.5 transition-all group-hover:scale-105 ${
                hasMyStatus
                  ? 'bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-500 shadow-xs'
                  : 'bg-stone-200'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-[10px] flex items-center justify-center rounded-full">
                    {currentUser?.name?.slice(0, 2).toUpperCase() || 'ME'}
                  </div>
                )}
              </div>
            </div>
            {/* Plus badge on avatar */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center ring-1.5 ring-white shadow-xs">
              <Plus className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
              My Status
            </h4>
            <div className="text-[11px] text-stone-500 truncate mt-0.5 flex items-center gap-1.5">
              <span>{hasMyStatus ? 'Tap to view status' : 'Tap to add status update'}</span>
              {hasMyStatus && (
                <span className="text-[10px] text-violet-700 font-bold flex items-center gap-0.5 bg-violet-100 px-1.5 py-0.5 rounded-full">
                  <Eye className="w-2.5 h-2.5 text-violet-600" />
                  {myTotalViews} {myTotalViews === 1 ? 'view' : 'views'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recent Updates Section */}
        {recentStatuses.length > 0 && (
          <div>
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1 mb-1.5">
              Recent Updates ({recentStatuses.length})
            </span>
            <div className="space-y-1">
              {recentStatuses.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onOpenContactStatus(st)}
                  className="p-2 rounded-xl hover:bg-stone-50 flex items-center gap-3 cursor-pointer transition-colors group"
                >
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-500 shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                      {st.userAvatar ? (
                        <img
                          src={st.userAvatar}
                          alt={st.userName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">
                          {st.userName?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-stone-900 truncate group-hover:text-violet-700 transition-colors">
                        {st.userName}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-medium ml-1">
                        {st.timestamp || 'Recent'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {st.stories?.[0]?.caption ||
                        (st.stories?.[0]?.type === 'text'
                          ? st.stories[0].text
                          : 'Photo story')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewed Updates Section */}
        {viewedStatuses.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowViewed((v) => !v)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1 mb-1.5 hover:text-stone-600 cursor-pointer"
            >
              <span>Viewed Updates ({viewedStatuses.length})</span>
              {showViewed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {showViewed && (
              <div className="space-y-1">
                {viewedStatuses.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => onOpenContactStatus(st)}
                    className="p-2 rounded-xl hover:bg-stone-50 flex items-center gap-3 cursor-pointer transition-colors group opacity-75 hover:opacity-100"
                  >
                    <div className="w-11 h-11 rounded-full p-0.5 ring-1.5 ring-stone-300 bg-stone-100 shadow-2xs flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                        {st.userAvatar ? (
                          <img
                            src={st.userAvatar}
                            alt={st.userName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-200 text-stone-600 font-bold text-xs flex items-center justify-center">
                            {st.userName?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-stone-700 truncate group-hover:text-violet-700 transition-colors">
                          {st.userName}
                        </h4>
                        <span className="text-[10px] text-stone-400 font-medium ml-1">
                          {st.timestamp || 'Viewed'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {st.stories?.[0]?.caption || 'Photo story'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state when no contact updates yet */}
        {recentStatuses.length === 0 && viewedStatuses.length === 0 && (
          <div className="pt-6 pb-4 px-3 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-stone-700">No updates from contacts yet</p>
            <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
              Tap <span className="font-semibold text-violet-700">Add</span> above to share your own status update!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
