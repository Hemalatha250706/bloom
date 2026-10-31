import { supabase } from '../lib/supabaseClient.js';

/**
 * Deterministically generates a valid UUID v4 formatted string from any identifier (email, phone, etc.)
 * Strips whitespace, dashes, and brackets so formatting variations map to the same UUID.
 */
export function stringToUuid(str) {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str.toLowerCase();

  // Normalize string (strip spaces, hyphens, parentheses)
  const cleanStr = String(str).replace(/[\s\-\(\)]/g, '').toLowerCase();

  // Create a 32-character hex hash from normalized string
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < cleanStr.length; i++) {
    const ch = cleanStr.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const hex4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const raw = (hex1 + hex2 + hex3 + hex4).slice(0, 32);

  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

/**
 * Format time helper (e.g. "10:30 AM")
 */
export function formatTimestamp(dateObj) {
  const d = dateObj ? new Date(dateObj) : new Date();
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date label helper (e.g. "Today", "Yesterday", "Oct 31")
 */
export function formatDateLabel(dateObj) {
  const d = dateObj ? new Date(dateObj) : new Date();
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Clean phone number helper (removes non-digits except +)
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Parses message content safely (supports plain text or serialized JSON with attachments/reactions)
 */
export function parseMessageContent(rawContent) {
  if (!rawContent) {
    return { text: '', attachment: null, status: 'delivered', reaction: null };
  }
  if (typeof rawContent === 'object') {
    return {
      text: rawContent.text || '',
      attachment: rawContent.attachment || null,
      status: rawContent.status || 'delivered',
      reaction: rawContent.reaction || null,
    };
  }
  if (typeof rawContent === 'string') {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return {
            text: parsed.text || '',
            attachment: parsed.attachment || null,
            status: parsed.status || 'delivered',
            reaction: parsed.reaction || null,
          };
        }
      } catch (e) {
        // Fallback to plain text
      }
    }
    return { text: rawContent, attachment: null, status: 'delivered', reaction: null };
  }
  return { text: String(rawContent), attachment: null, status: 'delivered', reaction: null };
}

/**
 * Maps Supabase messages row to frontend Message object
 */
export function mapSupabaseMessage(row) {
  const parsed = parseMessageContent(row.content);
  const createdAt = row.created_at ? new Date(row.created_at) : new Date();

  return {
    id: String(row.id),
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    text: parsed.text,
    attachment: parsed.attachment,
    status: parsed.status || 'delivered',
    reaction: parsed.reaction || null,
    timestamp: formatTimestamp(createdAt),
    date: formatDateLabel(createdAt),
    created_at: row.created_at,
  };
}

/**
 * Checks if a contact is currently online based on real-time presence data.
 * If nobody has logged into that account, it strictly returns FALSE.
 */
export function isContactOnline(contactUser, presenceState) {
  if (!contactUser || !presenceState) return false;
  const { onlineUserIds, onlineEmails, onlinePhones } = presenceState;

  // 1. Check User UUID
  if (contactUser.id && onlineUserIds && onlineUserIds.has(String(contactUser.id).toLowerCase())) {
    return true;
  }

  // 2. Check Email
  if (contactUser.email && onlineEmails) {
    const cleanEmail = contactUser.email.toLowerCase().trim();
    if (cleanEmail && onlineEmails.has(cleanEmail)) {
      return true;
    }
  }

  // 3. Check Phone
  if (contactUser.phone && onlinePhones) {
    const digitsOnly = contactUser.phone.replace(/\D/g, '');
    if (digitsOnly && onlinePhones.has(digitsOnly)) {
      return true;
    }
  }

  return false;
}

/**
 * Bloom Real-Time Chat, Zero-Deletion Storage, and Real Presence Service
 */
export const chatService = {
  // 1. Local Storage Message Persistence (Guarantee zero deletion on reload)
  saveMessagesToCache(conversationId, messages) {
    try {
      if (!conversationId) return;
      localStorage.setItem(`bloom_msgs_${conversationId}`, JSON.stringify(messages || []));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  getMessagesFromCache(conversationId) {
    try {
      if (!conversationId) return [];
      const saved = localStorage.getItem(`bloom_msgs_${conversationId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    return [];
  },

  // 2. Local Storage Conversation Persistence
  saveConversationsToCache(userId, conversations) {
    try {
      if (!userId) return;
      const stripped = conversations.map((conv) => ({
        id: conv.id,
        user: {
          ...conv.user,
          status: 'offline', // Always persist as offline; real status determined live via presence
        },
        unreadCount: conv.unreadCount || 0,
        pinned: Boolean(conv.pinned),
        pinnedMessageId: conv.pinnedMessageId || null,
        lastActivity: conv.lastActivity || Date.now(),
      }));
      localStorage.setItem(`bloom_convs_${userId}`, JSON.stringify(stripped));
    } catch (e) {
      console.warn('LocalStorage conv save error:', e);
    }
  },

  getConversationsFromCache(userId) {
    try {
      if (!userId) return [];
      const saved = localStorage.getItem(`bloom_convs_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c) => ({
            ...c,
            user: {
              ...c.user,
              status: 'offline', // default offline until live presence verifies
            },
          }));
        }
      }
    } catch (e) {
      console.warn('LocalStorage conv load error:', e);
    }
    return [];
  },

  // 3. Real-Time Presence Tracking (Only users who are ACTUALLY logged in show as online)
  initPresence(currentUser, onPresenceChange) {
    if (!currentUser?.id) return null;

    const userUuid = stringToUuid(currentUser.id);
    const cleanEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : '';
    const digitsOnlyPhone = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';

    const channel = supabase.channel('bloom-presence-room', {
      config: {
        presence: {
          key: userUuid,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set();
        const onlineEmails = new Set();
        const onlinePhones = new Set();

        Object.values(state).forEach((presences) => {
          if (Array.isArray(presences)) {
            presences.forEach((p) => {
              if (p.user_id) onlineUserIds.add(String(p.user_id).toLowerCase());
              if (p.email) onlineEmails.add(String(p.email).toLowerCase().trim());
              if (p.phone) onlinePhones.add(String(p.phone).replace(/\D/g, ''));
            });
          }
        });

        if (typeof onPresenceChange === 'function') {
          onPresenceChange({ onlineUserIds, onlineEmails, onlinePhones });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userUuid,
            email: cleanEmail,
            phone: digitsOnlyPhone,
            name: currentUser.name || '',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  },

  // 4. Fetch Real Messages from Supabase between two users
  async fetchMessages(userId, targetUserId) {
    if (!userId || !targetUserId) return [];

    const userUuid = stringToUuid(userId);
    const targetUuid = stringToUuid(targetUserId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userUuid},receiver_id.eq.${targetUuid}),and(sender_id.eq.${targetUuid},receiver_id.eq.${userUuid})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetchMessages error:', error.message);
        return [];
      }

      return (data || []).map(mapSupabaseMessage);
    } catch (err) {
      console.warn('fetchMessages exception:', err);
      return [];
    }
  },

  // 5. Send Message to Supabase and return mapped message
  async sendMessage({ senderId, receiverId, text, attachment, status = 'delivered', reaction = null }) {
    const senderUuid = stringToUuid(senderId);
    const receiverUuid = stringToUuid(receiverId);

    // Format content with metadata if attachments or reactions exist
    const contentPayload =
      !attachment && !reaction && status === 'delivered'
        ? text
        : JSON.stringify({
            text: text || '',
            attachment: attachment || null,
            status,
            reaction,
          });

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: senderUuid,
            receiver_id: receiverUuid,
            content: contentPayload,
          },
        ])
        .select();

      if (error) {
        console.warn('Supabase sendMessage warning:', error.message);
        return null;
      }

      if (data && data[0]) {
        return mapSupabaseMessage(data[0]);
      }
    } catch (err) {
      console.warn('sendMessage exception:', err);
    }
    return null;
  },

  // 6. Subscribe to Real-Time incoming & outgoing messages via Supabase Realtime
  subscribeToUserMessages(userId, onMessageReceived) {
    if (!userId) return null;
    const userUuid = stringToUuid(userId);

    const channelName = `bloom-realtime-${userUuid}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          // Check if this message involves the current user as sender or receiver
          const isSender = row.sender_id?.toLowerCase() === userUuid.toLowerCase();
          const isReceiver = row.receiver_id?.toLowerCase() === userUuid.toLowerCase();

          if (isSender || isReceiver) {
            const mapped = mapSupabaseMessage(row);
            onMessageReceived(mapped, { isSender, isReceiver });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🌸 Bloom Real-time connection active for user:', userUuid);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
