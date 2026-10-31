import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { Send, Smile, Paperclip, Image, FileText, X, Sparkles } from 'lucide-react';

export default function MessageInput({ onSendMessage, disabled }) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const isSendingRef = useRef(false);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target)) {
        setShowAttachmentMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachmentPreview) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;
    onSendMessage(trimmed, attachmentPreview);
    setText('');
    setAttachmentPreview(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    setTimeout(() => {
      isSendingRef.current = false;
    }, 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle local image file upload from device
  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentPreview({
        type: 'image',
        name: file.name,
        size: formatFileSize(file.size),
        url: event.target?.result,
        file: file,
      });
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
    e.target.value = '';
  };

  // Handle local document/PDF file upload from device
  const handleDocFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentPreview({
        type: 'file',
        name: file.name,
        size: formatFileSize(file.size),
        url: event.target?.result,
        file: file,
      });
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
    e.target.value = '';
  };

  return (
    <div className="relative p-3 sm:p-4 bg-white/95 border-t border-violet-100/90 backdrop-blur-md">
      {/* Hidden Native File Inputs for Local Device Storage */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileSelect}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
        onChange={handleDocFileSelect}
        className="hidden"
      />

      {/* Attachment Preview Badge with local image thumbnail */}
      {attachmentPreview && (
        <div className="mb-2.5 px-3 py-2 rounded-2xl bg-violet-50/90 border border-violet-200 flex items-center justify-between text-xs text-stone-700 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            {attachmentPreview.type === 'image' && attachmentPreview.url ? (
              <img
                src={attachmentPreview.url}
                alt={attachmentPreview.name}
                className="w-10 h-10 rounded-xl object-cover border border-violet-200 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0 font-bold">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-stone-900 truncate block max-w-xs">
                {attachmentPreview.name}
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                {attachmentPreview.size}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachmentPreview(null)}
            className="w-6 h-6 rounded-full hover:bg-violet-200/60 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Input Bar */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 bg-stone-50/90 rounded-full p-1.5 pl-3 sm:pl-4 border border-stone-200 shadow-sm focus-within:bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
        {/* Attachment Button */}
        <div className="relative" ref={attachmentMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
            }}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showAttachmentMenu
                ? 'bg-violet-100 text-violet-700'
                : 'text-stone-500 hover:text-violet-700 hover:bg-violet-50'
            }`}
            title="Add attachment from files"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Attachment options dropdown */}
          {showAttachmentMenu && (
            <div className="absolute bottom-12 left-0 z-30 w-56 bg-white border border-stone-200 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-violet-50 hover:text-violet-800 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                  <Image className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Photos & Media</p>
                  <p className="text-[10px] text-stone-400 font-normal">Pick from your device</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-purple-50 hover:text-purple-800 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Document / PDF</p>
                  <p className="text-[10px] text-stone-400 font-normal">Choose document file</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Emoji Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'bg-violet-100 text-violet-700'
                : 'text-stone-500 hover:text-violet-700 hover:bg-violet-50'
            }`}
            title="Open HD Emoji picker"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* HD Full Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-40 shadow-2xl rounded-2xl overflow-hidden border border-violet-200 bg-white animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>HD Emoji Collection</span>
                </div>
                <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
                  Apple HD Style
                </span>
              </div>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                autoFocusSearch={false}
                theme={Theme.LIGHT}
                emojiStyle={EmojiStyle.APPLE}
                searchPlaceHolder="Search all HD emojis..."
                width={340}
                height={400}
                lazyLoadEmojis={true}
                previewConfig={{
                  showPreview: true,
                  defaultCaption: 'Choose your HD emoji',
                }}
              />
            </div>
          )}
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a serene message..."
          className="flex-1 bg-transparent py-2 px-1 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none font-medium"
        />

        {/* Send Button in Lavender Gradient */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !attachmentPreview)}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-pointer ${
            text.trim() || attachmentPreview
              ? 'bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 text-white shadow-md shadow-violet-400/30 hover:scale-105 active:scale-95'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      <div className="mt-1.5 text-center">
        <span className="text-[11px] text-stone-400 font-medium">
          Press <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] text-stone-600 font-semibold">Enter</kbd> to send
        </span>
      </div>
    </div>
  );
}
