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
 * Universal email-to-UUID mapper so User A and User B always share identical matching address IDs
 */
export function getEmailUuid(email) {
  if (!email) return '00000000-0000-0000-0000-000000000000';
  return stringToUuid(String(email).trim().toLowerCase());
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
      senderEmail: rawContent.senderEmail || '',
      receiverEmail: rawContent.receiverEmail || '',
      senderName: rawContent.senderName || '',
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
            senderEmail: parsed.senderEmail || '',
            receiverEmail: parsed.receiverEmail || '',
            senderName: parsed.senderName || '',
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
    senderEmail: parsed.senderEmail || '',
    receiverEmail: parsed.receiverEmail || '',
    senderName: parsed.senderName || '',
    text: parsed.text,
    attachment: parsed.attachment,
    status: parsed.status || 'delivered',
    reaction: parsed.reaction || null,
    timestamp: formatTimestamp(createdAt),
    date: formatDateLabel(createdAt),
    created_at: row.created_at || createdAt.toISOString(),
  };
}

/**
 * Checks if a contact is currently online based on real-time presence data.
 */
export function isContactOnline(contactUser, presenceState) {
  if (!contactUser || !presenceState) return false;
  const { onlineUserIds, onlineEmails } = presenceState;

  // 1. Check Email
  if (contactUser.email && onlineEmails) {
    const cleanEmail = contactUser.email.toLowerCase().trim();
    if (cleanEmail && onlineEmails.has(cleanEmail)) {
      return true;
    }
  }

  // 2. Check User UUID or Email Hash UUID
  if (contactUser.id && onlineUserIds) {
    const lowerId = String(contactUser.id).toLowerCase();
    if (onlineUserIds.has(lowerId)) return true;
  }

  if (contactUser.email && onlineUserIds) {
    const emailUuid = getEmailUuid(contactUser.email);
    if (onlineUserIds.has(emailUuid)) return true;
  }

  return false;
}

// Global active Realtime Channel singleton
let globalRealtimeChannel = null;

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
  saveConversationsToCache(userKey, conversations) {
    try {
      if (!userKey) return;
      const stripped = (conversations || []).map((conv) => ({
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
      localStorage.setItem(`bloom_convs_${userKey}`, JSON.stringify(stripped));
    } catch (e) {
      console.warn('LocalStorage conv save error:', e);
    }
  },

  getConversationsFromCache(userKey) {
    try {
      if (!userKey) return [];
      const saved = localStorage.getItem(`bloom_convs_${userKey}`);
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

  // 3. Status Persistence in LocalStorage
  saveMyStatusesToCache(userKey, statuses) {
    try {
      if (!userKey) return;
      localStorage.setItem(`bloom_my_status_${userKey}`, JSON.stringify(statuses || []));
    } catch (e) {
      console.warn('LocalStorage save status error:', e);
    }
  },

  getMyStatusesFromCache(userKey) {
    try {
      if (!userKey) return [];
      const saved = localStorage.getItem(`bloom_my_status_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage load status error:', e);
    }
    return [];
  },

  saveContactStatusesToCache(statuses) {
    try {
      localStorage.setItem('bloom_contact_statuses', JSON.stringify(statuses || []));
    } catch (e) {
      console.warn('LocalStorage save contact status error:', e);
    }
  },

  getContactStatusesFromCache() {
    try {
      const saved = localStorage.getItem('bloom_contact_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage load contact status error:', e);
    }
    return [];
  },

  // 4. Unified Real-Time Hub: Presence + Direct Messaging Broadcast + Live Statuses
  initRealtimeHub(currentUser, { onPresenceChange, onMessageReceived, onStatusReceived, onStatusViewReceived }) {
    if (!currentUser) return () => {};

    const cleanEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : '';
    const emailUuid = getEmailUuid(cleanEmail);
    const userUuid = currentUser.id && currentUser.id !== 'current_user' ? currentUser.id : emailUuid;

    // Disconnect old channel if existing
    if (globalRealtimeChannel) {
      try {
        supabase.removeChannel(globalRealtimeChannel);
      } catch (e) {}
    }

    const channel = supabase.channel('bloom-global-hub', {
      config: {
        presence: {
          key: emailUuid,
        },
      },
    });

    globalRealtimeChannel = channel;

    // A) Real-time Presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set();
        const onlineEmails = new Set();

        Object.values(state).forEach((presences) => {
          if (Array.isArray(presences)) {
            presences.forEach((p) => {
              if (p.user_id) onlineUserIds.add(String(p.user_id).toLowerCase());
              if (p.email_uuid) onlineUserIds.add(String(p.email_uuid).toLowerCase());
              if (p.email) onlineEmails.add(String(p.email).toLowerCase().trim());
            });
          }
        });

        if (typeof onPresenceChange === 'function') {
          onPresenceChange({ onlineUserIds, onlineEmails });
        }
      })
      // B) Instant Direct Chat Message Broadcast (Bypasses any DB/RLS permission barriers)
      .on('broadcast', { event: 'bloom_message' }, ({ payload }) => {
        if (!payload) return;
        const targetReceiverEmail = payload.receiverEmail?.toLowerCase().trim();
        const targetSenderEmail = payload.senderEmail?.toLowerCase().trim();
        const myEmail = cleanEmail;

        const isReceiver =
          targetReceiverEmail === myEmail ||
          payload.receiverId?.toLowerCase() === emailUuid.toLowerCase() ||
          payload.receiverId?.toLowerCase() === userUuid.toLowerCase();

        const isSender =
          targetSenderEmail === myEmail ||
          payload.senderId?.toLowerCase() === emailUuid.toLowerCase() ||
          payload.senderId?.toLowerCase() === userUuid.toLowerCase();

        if (isReceiver || isSender) {
          if (typeof onMessageReceived === 'function') {
            onMessageReceived(payload, { isSender, isReceiver });
          }
        }
      })
      // C) Real-Time Status Broadcast (When a user posts a new story/status)
      .on('broadcast', { event: 'bloom_status' }, ({ payload }) => {
        if (!payload) return;
        // Don't duplicate my own status from broadcast
        if (payload.userEmail?.toLowerCase().trim() !== cleanEmail) {
          if (typeof onStatusReceived === 'function') {
            onStatusReceived(payload);
          }
        }
      })
      // D) Real-Time Status View Broadcast
      .on('broadcast', { event: 'bloom_status_view' }, ({ payload }) => {
        if (!payload) return;
        if (typeof onStatusViewReceived === 'function') {
          onStatusViewReceived(payload);
        }
      })
      // E) Database changes fallback listener
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (change) => {
          const row = change?.new;
          if (!row) return;
          const mapped = mapSupabaseMessage(row);
          const targetReceiverEmail = mapped.receiverEmail?.toLowerCase().trim();
          const targetSenderEmail = mapped.senderEmail?.toLowerCase().trim();
          const myEmail = cleanEmail;

          const isReceiver =
            targetReceiverEmail === myEmail ||
            mapped.receiverId?.toLowerCase() === emailUuid.toLowerCase() ||
            mapped.receiverId?.toLowerCase() === userUuid.toLowerCase();

          const isSender =
            targetSenderEmail === myEmail ||
            mapped.senderId?.toLowerCase() === emailUuid.toLowerCase() ||
            mapped.senderId?.toLowerCase() === userUuid.toLowerCase();

          if (isReceiver || isSender) {
            if (typeof onMessageReceived === 'function') {
              onMessageReceived(mapped, { isSender, isReceiver });
            }
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userUuid,
            email_uuid: emailUuid,
            email: cleanEmail,
            name: currentUser.name || cleanEmail.split('@')[0],
            avatar: currentUser.avatar || '',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      try {
        channel.untrack();
        supabase.removeChannel(channel);
        if (globalRealtimeChannel === channel) {
          globalRealtimeChannel = null;
        }
      } catch (e) {}
    };
  },

  // 5. Broadcast a message instantly to the recipient
  async broadcastMessage(messagePayload) {
    if (globalRealtimeChannel) {
      try {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'bloom_message',
          payload: messagePayload,
        });
      } catch (err) {
        console.warn('Broadcast send error:', err);
      }
    }
  },

  // 6. Broadcast a newly posted status to all contacts
  async broadcastStatus(statusPayload) {
    if (globalRealtimeChannel) {
      try {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'bloom_status',
          payload: statusPayload,
        });
      } catch (err) {
        console.warn('Broadcast status error:', err);
      }
    }
  },

  // 7. Broadcast viewing a status
  async broadcastStatusView(viewPayload) {
    if (globalRealtimeChannel) {
      try {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'bloom_status_view',
          payload: viewPayload,
        });
      } catch (err) {
        console.warn('Broadcast status view error:', err);
      }
    }
  },

  // 8. Fetch Messages from Supabase Database between two email/user entities
  async fetchMessages(senderEmailOrId, receiverEmailOrId) {
    if (!senderEmailOrId || !receiverEmailOrId) return [];

    const senderUuid = senderEmailOrId.includes('@')
      ? getEmailUuid(senderEmailOrId)
      : stringToUuid(senderEmailOrId);

    const receiverUuid = receiverEmailOrId.includes('@')
      ? getEmailUuid(receiverEmailOrId)
      : stringToUuid(receiverEmailOrId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${senderUuid},receiver_id.eq.${receiverUuid}),and(sender_id.eq.${receiverUuid},receiver_id.eq.${senderUuid})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetchMessages note:', error.message);
        return [];
      }

      return (data || []).map(mapSupabaseMessage);
    } catch (err) {
      console.warn('fetchMessages exception:', err);
      return [];
    }
  },

  // 9. Send Message: Broadcasts in real-time AND saves to Supabase database
  async sendMessage({
    senderId,
    senderEmail,
    senderName,
    receiverId,
    receiverEmail,
    text,
    attachment,
    status = 'delivered',
    reaction = null,
  }) {
    const cleanSenderEmail = (senderEmail || '').toLowerCase().trim();
    const cleanReceiverEmail = (receiverEmail || '').toLowerCase().trim();

    const senderUuid = cleanSenderEmail
      ? getEmailUuid(cleanSenderEmail)
      : stringToUuid(senderId);

    const receiverUuid = cleanReceiverEmail
      ? getEmailUuid(cleanReceiverEmail)
      : stringToUuid(receiverId);

    const now = new Date();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const messagePayload = {
      id: messageId,
      senderId: senderUuid,
      senderEmail: cleanSenderEmail,
      senderName: senderName || cleanSenderEmail.split('@')[0],
      receiverId: receiverUuid,
      receiverEmail: cleanReceiverEmail,
      text: text || '',
      attachment: attachment || null,
      status,
      reaction,
      timestamp: formatTimestamp(now),
      date: 'Today',
      created_at: now.toISOString(),
    };

    // Step A: Deliver immediately via Real-Time Broadcast!
    await this.broadcastMessage(messagePayload);

    // Step B: Persist to Supabase Database (if available/configured)
    const contentPayload = JSON.stringify({
      text: text || '',
      senderEmail: cleanSenderEmail,
      receiverEmail: cleanReceiverEmail,
      senderName: senderName || '',
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
        console.warn('Supabase DB message insert note:', error.message);
      } else if (data && data[0]) {
        messagePayload.id = String(data[0].id);
        messagePayload.created_at = data[0].created_at;
      }
    } catch (err) {
      console.warn('Supabase DB insert exception:', err);
    }

    return messagePayload;
  },
};
