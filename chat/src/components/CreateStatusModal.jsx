import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Type,
  Image as ImageIcon,
  Send,
  Sparkles,
} from 'lucide-react';

const GRADIENT_PRESETS = [
  { id: 'g1', name: 'Violet', bg: 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600' },
  { id: 'g2', name: 'Rose', bg: 'bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-rose-600' },
  { id: 'g3', name: 'Mint', bg: 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600' },
  { id: 'g4', name: 'Sunset', bg: 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500' },
];

export default function CreateStatusModal({ isOpen, onClose, onPostStatus, onOpenLiveCamera }) {
  const [tab, setTab] = useState('photo'); // 'photo' | 'text'
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].bg);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit and post status
  const handleSubmit = (e) => {
    e?.preventDefault();

    if (tab === 'photo' && !photoUrl) return;
    if (tab === 'text' && !textContent.trim()) return;

    const newStory =
      tab === 'photo'
        ? {
            id: `story-${Date.now()}`,
            type: 'image',
            url: photoUrl,
            caption: caption.trim(),
            createdAt: 'Just now',
          }
        : {
            id: `story-${Date.now()}`,
            type: 'text',
            text: textContent.trim(),
            background: selectedGradient,
            createdAt: 'Just now',
          };

    onPostStatus(newStory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-violet-100 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-stone-900">Add New Status</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Photo Status vs Text Status */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl mb-4">
          <button
            onClick={() => setTab('photo')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'photo'
                ? 'bg-white text-violet-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo Status</span>
          </button>
          <button
            onClick={() => setTab('text')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'text'
                ? 'bg-white text-violet-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Status</span>
          </button>
        </div>

        {/* TAB 1: PHOTO STATUS */}
        {tab === 'photo' && (
          <div className="space-y-3.5 overflow-y-auto flex-1 pr-1">
            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden h-52 bg-black flex items-center justify-center shadow-inner">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Take Snap with Camera */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLiveCamera) onOpenLiveCamera();
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-violet-500/25 flex flex-col items-center justify-center gap-1.5 transition-all"
                >
                  <Camera className="w-6 h-6" />
                  <span>Open Camera to Take Photo</span>
                </button>

                {/* Upload from Device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Upload className="w-4 h-4 text-violet-600" />
                  <span>Upload Image from Device</span>
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Caption Input */}
            {photoUrl && (
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Add a Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Type a caption with emojis 🌸..."
                  className="w-full bg-stone-50 px-3 py-2 rounded-xl text-xs sm:text-sm text-stone-800 border border-stone-200 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-200 font-medium"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEXT STATUS */}
        {tab === 'text' && (
          <div className="space-y-3.5 overflow-y-auto flex-1 pr-1">
            {/* Live Text Status Canvas */}
            <div
              className={`w-full h-48 rounded-2xl p-6 flex items-center justify-center text-center text-white font-extrabold shadow-inner transition-all ${selectedGradient}`}
            >
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your status update..."
                rows={3}
                className="w-full bg-transparent text-center text-xl sm:text-2xl font-extrabold placeholder:text-white/60 focus:outline-none resize-none drop-shadow-md text-white"
              />
            </div>

            {/* Gradient Selector */}
            <div>
              <span className="block text-[11px] font-bold text-stone-600 mb-1.5">
                Choose Background Color:
              </span>
              <div className="flex items-center gap-2">
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGradient(g.bg)}
                    className={`w-8 h-8 rounded-full ${g.bg} ring-2 transition-transform ${
                      selectedGradient === g.bg
                        ? 'ring-stone-900 scale-110 shadow-sm'
                        : 'ring-white hover:scale-105'
                    }`}
                    title={g.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Post Button */}
        <div className="pt-3 border-t border-stone-100 mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(tab === 'photo' && !photoUrl) || (tab === 'text' && !textContent.trim())}
            className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              (tab === 'photo' && photoUrl) || (tab === 'text' && textContent.trim())
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/25 hover:scale-[1.01]'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Post Status</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

