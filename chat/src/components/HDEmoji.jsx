import React from 'react';

// Helper to convert emoji to unified hex format used by Apple emoji datasource
export function emojiToUnified(emoji) {
  return [...emoji]
    .map((char) => char.codePointAt(0).toString(16))
    .filter((code) => code !== 'fe0f')
    .join('-');
}

// Single HD Apple Emoji image component
export default function HDEmoji({ emoji, size = 22, className = '' }) {
  const unified = emojiToUnified(emoji);
  const appleUrl = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unified}.png`;

  return (
    <img
      src={appleUrl}
      alt={emoji}
      className={`inline-block align-middle select-none pointer-events-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      loading="eager"
      onError={(e) => {
        // Fallback to text emoji if offline or loading fails
        e.currentTarget.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.className = 'inline-block align-middle';
        fallback.style.fontSize = `${size}px`;
        fallback.textContent = emoji;
        e.currentTarget.parentElement?.insertBefore(fallback, e.currentTarget);
      }}
    />
  );
}

// Unicode regex matching emojis including composites, skin tones, and joiners
const EMOJI_REGEX = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;

// High-definition text parser that converts all emojis into Apple HD graphics
export function renderHDText(text, emojiSize = 22) {
  if (!text) return null;

  const trimmed = text.trim();
  const allEmojis = trimmed.match(EMOJI_REGEX);
  const textWithoutEmojis = trimmed.replace(EMOJI_REGEX, '').trim();

  // If message contains ONLY 1 to 4 emojis, display them in extra large Jumbo HD size
  if (allEmojis && allEmojis.length > 0 && allEmojis.length <= 4 && textWithoutEmojis.length === 0) {
    return (
      <span className="flex items-center gap-2 py-1">
        {allEmojis.map((em, idx) => (
          <HDEmoji
            key={idx}
            emoji={em}
            size={40}
            className="hover:scale-115 transition-transform drop-shadow-xs"
          />
        ))}
      </span>
    );
  }

  // Mixed regular text with inline HD emojis
  const parts = text.split(EMOJI_REGEX);
  return parts.map((part, index) => {
    if (EMOJI_REGEX.test(part)) {
      return (
        <HDEmoji
          key={index}
          emoji={part}
          size={emojiSize}
          className="mx-0.5 inline-block align-sub"
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
}
