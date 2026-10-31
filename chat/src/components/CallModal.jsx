import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function CallModal({ callData, onClose }) {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    if (!callData) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callData]);

  if (!callData) return null;

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 border border-violet-100 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Soft ambient glows */}
        <div className="w-32 h-32 rounded-full bg-violet-200/50 absolute -top-10 -left-10 blur-2xl pointer-events-none" />
        <div className="w-32 h-32 rounded-full bg-purple-200/50 absolute -bottom-10 -right-10 blur-2xl pointer-events-none" />

        {/* Pulse ring around avatar */}
        <div className="relative mt-2 mb-4">
          <div className="absolute -inset-3 rounded-full bg-violet-400/40 animate-ping opacity-75" />
          <img
            src={callData.avatar}
            alt={callData.name}
            className="relative w-22 h-22 rounded-full object-cover ring-4 ring-violet-300 shadow-xl"
          />
        </div>

        <h3 className="text-xl font-extrabold text-stone-900">{callData.name}</h3>
        <p className="text-xs text-violet-700 font-bold mt-1 bg-violet-100 px-3 py-1 rounded-full border border-violet-200">
          {callData.type === 'video' ? 'Bloom HD Video Call' : 'Bloom Voice Call'} • {formatTime(seconds)}
        </p>

        {/* Call Controls */}
        <div className="flex items-center gap-4 mt-8 mb-2">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-md ${
              isMuted
                ? 'bg-rose-100 text-rose-700'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera */}
          {callData.type === 'video' && (
            <button
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-md ${
                isVideoMuted
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onClose}
            className="w-13 h-13 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform hover:scale-105 active:scale-95"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
