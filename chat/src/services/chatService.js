import { supabase } from '../lib/supabaseClient.js';

/**
 * Universal UUID generator from any string (fallback if needed)
 */
export function stringToUuid(str) {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str.toLowerCase();

  const cleanStr = String(str).replace(/[\s\-\(\)]/g, '').toLowerCase();
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

export function getEmailUuid(email) {
  if (!email) return '00000000-0000-0000-0000-000000000000';
  return stringToUuid(String(email).trim().toLowerCase());
}

export function formatTimestamp(dateObj) {
  const d = dateObj ? new Date(dateObj) : new Date();
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Normalizes message row from Supabase into frontend Message format
 */
export function mapSupabaseMessage(row) {
  if (!row) return null;
  const createdAt = row.created_at ? new Date(row.created_at) : new Date();
  let parsedContent = row.text || '';
  let attachment = row.attachment || null;
  let senderEmail = '';
  let senderName = '';

  // If content is stored as JSON string (legacy or fallback)
  if (row.content && !row.text) {
    if (typeof row.content === 'string' && row.content.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(row.content);
        parsedContent = obj.text || '';
        attachment = obj.attachment || attachment;
        senderEmail = obj.senderEmail || '';
        senderName = obj.senderName || '';
      } catch (e) {
        parsedContent = row.content;
      }
    } else {
      parsedContent = row.content;
    }
  }

  return {
    id: String(row.id),
    conversationId: row.conversation_id || null,
    senderId: String(row.sender_id || ''),
    senderEmail,
    senderName,
    text: parsedContent || '',
    attachment,
    status: row.status || 'delivered',
    reaction: row.reaction || null,
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

  if (contactUser.email && onlineEmails) {
    const cleanEmail = contactUser.email.toLowerCase().trim();
    if (cleanEmail && onlineEmails.has(cleanEmail)) return true;
  }

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

// Active channel singletons
let globalRealtimeChannel = null;
let activeConversationChannel = null;

export const chatService = {
  // ==============================================================================
  // 1. PROFILE MANAGEMENT (Upsert on login, Fetch Profile, & Search Users)
  // ==============================================================================

  /**
   * Fetches profile by Supabase user ID from public.profiles
   */
  async getProfile(userId) {
    if (!userId || userId === 'current_user') return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('getProfile DB notice:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('getProfile exception:', e);
      return null;
    }
  },

  /**
   * Ensure user's profile is registered in public.profiles table
   * Preserves existing username, custom avatar, and status.
   */
  async ensureProfile(user) {
    if (!user || !user.id || user.id === 'current_user') return null;
    const meta = user.user_metadata || {};
    const email = (user.email || '').toLowerCase().trim();
    const fallbackUsername = (
      meta.username ||
      meta.userId ||
      meta.name ||
      email.split('@')[0] ||
      'user'
    ).toLowerCase().trim().replace(/^@/, '');

    try {
      // 1. Check if profile already exists in DB
      const existing = await this.getProfile(user.id);
      if (existing) {
        return existing;
      }

      // 2. Insert new profile
      const payload = {
        id: user.id,
        name: meta.name || fallbackUsername,
        username: fallbackUsername,
        email,
        avatar_url: meta.avatar_url || meta.avatar || '',
        status: 'online',
        status_emoji: '🌸',
        status_text: 'Available',
        about: 'Available 🌸',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('ensureProfile DB notice:', error.message);
        return payload;
      }
      return data || payload;
    } catch (err) {
      console.warn('ensureProfile exception:', err);
      return null;
    }
  },

  /**
   * Updates user's profile fields in public.profiles table
   */
  async updateProfile(userId, updates) {
    if (!userId || !updates || userId === 'current_user') return null;
    try {
      const payload = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.username !== undefined) {
        payload.username = updates.username.toLowerCase().trim().replace(/^@/, '');
      }
      if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
      if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
      if (updates.about !== undefined) payload.about = updates.about;
      if (updates.status_emoji !== undefined) payload.status_emoji = updates.status_emoji;
      if (updates.status_text !== undefined) payload.status_text = updates.status_text;
      if (updates.phone !== undefined) payload.phone = updates.phone;

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) console.warn('updateProfile notice:', error.message);
      return data;
    } catch (e) {
      console.warn('updateProfile exception:', e);
      return null;
    }
  },

  /**
   * Fetch all registered users in Bloom
   * Queries Supabase profiles, merges local directory and registered cache,
   * and excludes currently logged-in user.
   */
  async fetchRegisteredUsers(currentUserId) {
    const usersMap = new Map();

    // 1. Try querying Supabase public.profiles table
    try {
      let query = supabase
        .from('profiles')
        .select('id, name, username, email, avatar_url, about, status, status_emoji, status_text, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (currentUserId && currentUserId !== 'current_user') {
        query = query.neq('id', currentUserId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        data.forEach((p) => {
          const handle = (p.username || p.name || p.email?.split('@')[0] || '').toLowerCase().trim().replace(/^@/, '');
          if (handle) {
            usersMap.set(handle, {
              id: p.id,
              name: handle,
              username: handle,
              userId: handle,
              email: p.email || `${handle}@bloom.chat`,
              avatar_url: p.avatar_url || '',
              status_emoji: p.status_emoji || '🌸',
              status_text: p.status_text || p.about || 'Available',
              about: p.about || 'Available 🌸',
              status: p.status || 'offline',
            });
          }
        });
      }
    } catch (e) {
      console.warn('fetchRegisteredUsers DB notice:', e);
    }

    // 2. Merge local registered users cache (bloom_registered_users)
    try {
      const cached = JSON.parse(localStorage.getItem('bloom_registered_users') || '[]');
      if (Array.isArray(cached)) {
        cached.forEach((u) => {
          const handle = (u.username || u.userId || u.name || '').toLowerCase().trim().replace(/^@/, '');
          if (handle && !usersMap.has(handle)) {
            usersMap.set(handle, {
              id: u.id || getEmailUuid(u.email || handle),
              name: handle,
              username: handle,
              userId: handle,
              email: u.email || `${handle}@bloom.chat`,
              avatar_url: u.avatar_url || u.avatar || '',
              status_emoji: u.status_emoji || '🌸',
              status_text: u.status_text || u.about || 'Available',
              about: u.about || 'Available 🌸',
              status: u.status || 'offline',
            });
          }
        });
      }
    } catch (e) {}

    // 3. Merge user directory (bloom_user_directory)
    try {
      const dir = JSON.parse(localStorage.getItem('bloom_user_directory') || '{}');
      Object.entries(dir).forEach(([handleRaw, emailRaw]) => {
        const handle = handleRaw.toLowerCase().trim().replace(/^@/, '');
        if (handle && !usersMap.has(handle)) {
          const email = (emailRaw || `${handle}@bloom.chat`).toLowerCase().trim();
          usersMap.set(handle, {
            id: getEmailUuid(email),
            name: handle,
            username: handle,
            userId: handle,
            email: email,
            avatar_url: '',
            status_emoji: '🌸',
            status_text: 'Available',
            about: 'Available 🌸',
            status: 'offline',
          });
        }
      });
    } catch (e) {}

    // 4. Default demo users so there are always verified contacts to chat with
    const defaultDemos = [
      { username: 'alex', email: 'alex@bloom.chat', about: 'Hey there! I am using Bloom 🌸' },
      { username: 'sam', email: 'sam@bloom.chat', about: 'Living serenely ✨' },
      { username: 'keerthi', email: 'keerthi@bloom.chat', about: 'Mindful messaging 🌸' },
    ];
    defaultDemos.forEach((d) => {
      if (!usersMap.has(d.username)) {
        usersMap.set(d.username, {
          id: getEmailUuid(d.email),
          name: d.username,
          username: d.username,
          userId: d.username,
          email: d.email,
          avatar_url: '',
          status_emoji: '🌸',
          status_text: d.about,
          about: d.about,
          status: 'offline',
        });
      }
    });

    // 5. Exclude currently logged-in user
    if (currentUserId) {
      usersMap.forEach((u, k) => {
        if (u.id === currentUserId) {
          usersMap.delete(k);
        }
      });
    }

    return Array.from(usersMap.values());
  },

  /**
   * Search registered users by username or name (case-insensitive)
   * If query is empty, returns all registered users.
   */
  async searchUsers(searchQuery, currentUserId) {
    const allUsers = await this.fetchRegisteredUsers(currentUserId);
    const query = (searchQuery || '').trim().toLowerCase().replace(/^@/, '');
    if (!query) return allUsers;

    return allUsers.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(query)) ||
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query))
    );
  },

  /**
   * Alias for backward compatibility
   */
  async searchUsersByEmail(searchQuery, currentUserId) {
    return this.searchUsers(searchQuery, currentUserId);
  },

  /**
   * Updates user's custom status emoji and text in profiles table
   */
  async updateUserStatus(userId, { statusEmoji, statusText }) {
    if (!userId) return null;
    const emoji = statusEmoji || '🌸';
    const text = statusText || 'Available';
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status_emoji: emoji,
          status_text: text,
          about: text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) console.warn('updateUserStatus notice:', error.message);

      // Broadcast status update
      if (globalRealtimeChannel) {
        globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'user_status_updated',
          payload: { userId, statusEmoji: emoji, statusText: text },
        });
      }

      return data;
    } catch (e) {
      console.warn('updateUserStatus exception:', e);
      return null;
    }
  },

  // ==============================================================================
  // 2. CONVERSATIONS & PARTICIPANTS (One-to-One Chat Connection)
  // ==============================================================================

  /**
   * Gets an existing 1-on-1 direct conversation between two users, or creates one.
   * Guarantees no duplicate conversations between the same pair of users.
   */
  async getOrCreateDirectConversation(currentUserId, otherUserId) {
    if (!currentUserId || !otherUserId) {
      throw new Error('Both currentUserId and otherUserId are required.');
    }

    try {
      // 1. Try atomic PostgreSQL RPC first (prevents race-condition duplicate conversations)
      const { data: rpcConvId, error: rpcErr } = await supabase.rpc(
        'get_or_create_direct_conversation',
        { user1_id: currentUserId, user2_id: otherUserId }
      );

      if (!rpcErr && rpcConvId) {
        return rpcConvId;
      }
    } catch (e) {
      // Fall through to client-side query
    }

    try {
      // Step A: Find all conversations current user participates in
      const { data: myParticipants, error: myPartErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (myPartErr) {
        console.warn('Error fetching current user participants:', myPartErr.message);
      }

      const myConvIds = (myParticipants || []).map((p) => p.conversation_id);

      // Step B: Check if otherUserId shares any of these conversations
      if (myConvIds.length > 0) {
        const { data: shared, error: sharedErr } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', myConvIds)
          .eq('user_id', otherUserId)
          .limit(1);

        if (!sharedErr && shared && shared.length > 0) {
          const matchedId = shared[0].conversation_id;
          // Unhide conversation if it was previously hidden by this user
          try {
            await supabase
              .from('conversation_participants')
              .update({ is_hidden: false })
              .eq('conversation_id', matchedId)
              .eq('user_id', currentUserId);
          } catch (e) {}
          return matchedId;
        }
      }

      // Step C: No existing conversation found. Create a new conversation row.
      const { data: newConv, error: newConvErr } = await supabase
        .from('conversations')
        .insert([{ type: 'direct', title: null }])
        .select()
        .single();

      if (newConvErr || !newConv) {
        throw new Error(newConvErr?.message || 'Failed to create conversation');
      }

      const conversationId = newConv.id;

      // Step D: Add both users to conversation_participants table
      const { error: partErr } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: currentUserId, pinned: false, unread_count: 0 },
          { conversation_id: conversationId, user_id: otherUserId, pinned: false, unread_count: 0 },
        ]);

      if (partErr) {
        console.warn('Error inserting conversation participants:', partErr.message);
      }

      return conversationId;
    } catch (err) {
      console.error('getOrCreateDirectConversation error:', err);
      // Fallback deterministic UUID based on sorted user IDs
      const sortedPair = [String(currentUserId), String(otherUserId)].sort().join('__');
      return stringToUuid(sortedPair);
    }
  },

  /**
   * Fetches all active conversations for a user, including participant info & last message.
   * Filters out conversations hidden/deleted by the current user.
   * Deduplicates contacts so each user appears only once.
   */
  async fetchUserConversations(currentUserId) {
    if (!currentUserId) return [];

    try {
      // 1. Get all conversation IDs where current user is a participant
      const { data: participations, error: partErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id, pinned, muted, is_hidden, hidden_at, unread_count')
        .eq('user_id', currentUserId);

      if (partErr || !participations || participations.length === 0) {
        return [];
      }

      // Filter out conversations hidden by the current user (per-user soft delete)
      const visibleParticipations = participations.filter((p) => !p.is_hidden);
      if (visibleParticipations.length === 0) {
        return [];
      }

      const convMap = new Map();
      visibleParticipations.forEach((p) => {
        convMap.set(p.conversation_id, {
          pinned: Boolean(p.pinned),
          muted: Boolean(p.muted),
          unreadCount: p.unread_count || 0,
        });
      });

      const convIds = Array.from(convMap.keys());

      // 2. Find other participants in these conversations
      const { data: otherParticipants, error: otherErr } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profiles (
            id,
            name,
            username,
            avatar_url,
            about,
            status,
            status_emoji,
            status_text
          )
        `)
        .in('conversation_id', convIds)
        .neq('user_id', currentUserId);

      if (otherErr) {
        console.warn('fetchUserConversations otherParticipants note:', otherErr.message);
      }

      // 3. For each conversation, fetch the latest message
      const results = [];
      const seenUserIds = new Set();

      for (const convId of convIds) {
        const participantInfo = (otherParticipants || []).find(
          (op) => op.conversation_id === convId
        );
        const otherProfile = participantInfo?.profiles || null;
        const otherUserId = participantInfo?.user_id;

        // Skip if we already added a conversation for this exact other user (deduplication)
        if (otherUserId && seenUserIds.has(otherUserId)) {
          continue;
        }
        if (otherUserId) seenUserIds.add(otherUserId);

        const convMeta = convMap.get(convId) || {};

        // Fetch last message for this conversation
        let lastMsg = null;
        try {
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (msgs && msgs[0]) {
            lastMsg = mapSupabaseMessage(msgs[0]);
          }
        } catch (e) {}

        const rawUsername =
          otherProfile?.username ||
          otherProfile?.name ||
          'user';
        const cleanHandle = rawUsername.replace(/^@/, '');

        results.push({
          id: convId,
          user: {
            id: otherUserId || convId,
            name: cleanHandle,
            userId: cleanHandle,
            username: cleanHandle,
            avatar: otherProfile?.avatar_url || '',
            about: otherProfile?.status_text || otherProfile?.about || 'Available',
            status: otherProfile?.status || 'offline',
            status_emoji: otherProfile?.status_emoji || '🌸',
            status_text: otherProfile?.status_text || otherProfile?.about || 'Available',
          },
          unreadCount: convMeta.unreadCount || 0,
          pinned: convMeta.pinned || false,
          muted: convMeta.muted || false,
          lastActivity: lastMsg?.created_at
            ? new Date(lastMsg.created_at).getTime()
            : Date.now(),
          messages: lastMsg ? [lastMsg] : [],
        });
      }

      // Sort by pinned first, then by last activity
      return results.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastActivity || 0) - (a.lastActivity || 0);
      });
    } catch (err) {
      console.warn('fetchUserConversations exception:', err);
      return [];
    }
  },

  /**
   * Mute or Unmute a conversation for the current user
   */
  async toggleMuteConversation(conversationId, currentUserId, isMuted) {
    if (!conversationId || !currentUserId) return;
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ muted: isMuted })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      if (error) console.warn('toggleMuteConversation notice:', error.message);
    } catch (e) {
      console.warn('toggleMuteConversation exception:', e);
    }
  },

  /**
   * Safe per-user deletion (soft delete) of a conversation from current user's list.
   * Does NOT delete messages or remove the chat for the other user.
   */
  async hideConversationForUser(conversationId, currentUserId) {
    if (!conversationId || !currentUserId) return;
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_hidden: true, hidden_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      if (error) console.warn('hideConversationForUser notice:', error.message);
    } catch (e) {
      console.warn('hideConversationForUser exception:', e);
    }
  },

  /**
   * Marks unread messages in a conversation as read by the current user.
   * Updates message status to 'read' (double blue ticks) and notifies sender via realtime.
   */
  async markMessagesAsRead(conversationId, currentUserId) {
    if (!conversationId || !currentUserId) return;
    const now = new Date().toISOString();
    try {
      // 1. Update messages in Supabase where receiver is currentUserId and status != 'read'
      const { error: msgErr } = await supabase
        .from('messages')
        .update({ status: 'read', read_at: now })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .neq('status', 'read');

      if (msgErr) console.warn('markMessagesAsRead notice:', msgErr.message);

      // 2. Reset unread counter for current user in conversation_participants
      await supabase
        .from('conversation_participants')
        .update({ unread_count: 0, last_read_at: now })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      // 3. Broadcast read receipt so sender UI updates to double blue ticks immediately
      if (globalRealtimeChannel) {
        globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'messages_read',
          payload: { conversationId, readerId: currentUserId, readAt: now },
        });
      }
    } catch (e) {
      console.warn('markMessagesAsRead exception:', e);
    }
  },

  // ==============================================================================
  // 3. MESSAGES (Fetch, Send, Realtime Subscription)
  // ==============================================================================

  /**
   * Fetches full message history for a given conversation ID
   */
  async fetchMessagesForConversation(conversationId) {
    if (!conversationId) return [];
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('fetchMessagesForConversation DB notice:', error.message);
        return [];
      }
      return (data || []).map(mapSupabaseMessage).filter(Boolean);
    } catch (err) {
      console.warn('fetchMessagesForConversation exception:', err);
      return [];
    }
  },

  /**
   * Sends a message in a conversation.
   * Inserts into messages table and broadcasts immediately for zero-latency.
   */
  async sendMessage({
    conversationId,
    senderId,
    recipientId = null,
    senderEmail,
    senderName,
    text,
    attachment,
    status = 'sent',
    reaction = null,
  }) {
    if (!conversationId || !senderId) {
      throw new Error('conversationId and senderId are required to send message.');
    }

    const now = new Date();
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const messagePayload = {
      id: tempId,
      conversationId,
      senderId,
      recipientId: recipientId || null,
      senderEmail: senderEmail || '',
      senderName: senderName || '',
      text: text || '',
      attachment: attachment || null,
      status, // starts as 'sent' (single grey tick)
      reaction,
      timestamp: formatTimestamp(now),
      date: 'Today',
      created_at: now.toISOString(),
    };

    // Broadcast immediately so recipient UI gets it instantaneously
    await this.broadcastMessage(messagePayload);

    // Save to Supabase Database
    try {
      const insertRow = {
        conversation_id: conversationId,
        sender_id: senderId,
        text: text || '',
        attachment: attachment || null,
        status,
        reaction,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([insertRow])
        .select();

      if (error) {
        console.warn('Supabase DB message insert notice:', error.message);
      } else if (data && data[0]) {
        messagePayload.id = String(data[0].id);
        messagePayload.created_at = data[0].created_at;
      }
    } catch (err) {
      console.warn('Supabase DB insert exception:', err);
    }

    return messagePayload;
  },

  /**
   * Adds, updates, or removes an emoji reaction on a message.
   * Updates Supabase and broadcasts to both users in real-time.
   */
  async toggleMessageReaction({ messageId, conversationId, currentUserId, emoji }) {
    if (!messageId) return null;
    try {
      // 1. Fetch current reaction
      const { data: currentMsg } = await supabase
        .from('messages')
        .select('reaction')
        .eq('id', messageId)
        .single();

      const newReaction = currentMsg?.reaction === emoji ? null : emoji;

      // 2. Update messages table
      await supabase
        .from('messages')
        .update({ reaction: newReaction })
        .eq('id', messageId);

      // 3. Upsert into message_reactions table if present
      try {
        if (newReaction && currentUserId) {
          await supabase
            .from('message_reactions')
            .upsert(
              { message_id: messageId, user_id: currentUserId, emoji: newReaction },
              { onConflict: 'message_id,user_id' }
            );
        } else if (!newReaction && currentUserId) {
          await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', currentUserId);
        }
      } catch (e) {}

      // 4. Broadcast live reaction event
      if (globalRealtimeChannel) {
        globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'message_reaction',
          payload: { messageId, conversationId, reaction: newReaction, userId: currentUserId },
        });
      }

      return newReaction;
    } catch (e) {
      console.warn('toggleMessageReaction exception:', e);
      return emoji;
    }
  },

  /**
   * Subscribes to new messages and message updates (e.g. read status, reactions)
   * for a specific conversation using Supabase Realtime.
   * Cleanly unsubscribes from any previous conversation channel.
   */
  subscribeToConversationMessages(conversationId, onMessageReceived, onMessageUpdated) {
    if (!conversationId) return () => {};

    // Clean up previous conversation subscription
    if (activeConversationChannel) {
      try {
        supabase.removeChannel(activeConversationChannel);
      } catch (e) {}
      activeConversationChannel = null;
    }

    const channelName = `conversation-${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!payload) return;
          if (payload.eventType === 'INSERT' && payload.new) {
            const mapped = mapSupabaseMessage(payload.new);
            if (mapped && typeof onMessageReceived === 'function') {
              onMessageReceived(mapped);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const mapped = mapSupabaseMessage(payload.new);
            if (mapped && typeof onMessageUpdated === 'function') {
              onMessageUpdated(mapped);
            }
          }
        }
      )
      .subscribe();

    activeConversationChannel = channel;

    return () => {
      try {
        supabase.removeChannel(channel);
        if (activeConversationChannel === channel) {
          activeConversationChannel = null;
        }
      } catch (e) {}
    };
  },

  // ==============================================================================
  // 4. GLOBAL REALTIME HUB (Presence + Live Broadcasts)
  // ==============================================================================

  initRealtimeHub(currentUser, {
    onPresenceChange,
    onMessageReceived,
    onStatusReceived,
    onStatusViewReceived,
    onMessagesRead,
    onMessageReaction,
    onUserStatusUpdated,
  }) {
    if (!currentUser) return () => {};

    const cleanEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : '';
    const emailUuid = getEmailUuid(cleanEmail);
    const userUuid = currentUser.id && currentUser.id !== 'current_user' ? currentUser.id : emailUuid;

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

    // Presence Tracking
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
      // Direct Broadcast Listener
      .on('broadcast', { event: 'bloom_message' }, ({ payload }) => {
        if (!payload) return;

        // Skip if message was broadcast by myself (prevents duplicate self-messages)
        const isSender =
          (payload.senderId && payload.senderId.toLowerCase() === userUuid.toLowerCase()) ||
          (payload.senderEmail && cleanEmail && payload.senderEmail.toLowerCase() === cleanEmail);

        if (isSender) return;

        // Skip if message has a specific recipient and it is not this user (prevents cross-user message leakage)
        if (payload.recipientId && payload.recipientId.toLowerCase() !== userUuid.toLowerCase()) {
          return;
        }

        if (typeof onMessageReceived === 'function') {
          onMessageReceived(payload, { isSender: false, isReceiver: true });
        }
      })
      // Status Broadcast
      .on('broadcast', { event: 'bloom_status' }, ({ payload }) => {
        if (!payload) return;
        if (payload.userEmail?.toLowerCase().trim() !== cleanEmail) {
          if (typeof onStatusReceived === 'function') {
            onStatusReceived(payload);
          }
        }
      })
      // Status View Broadcast
      .on('broadcast', { event: 'bloom_status_view' }, ({ payload }) => {
        if (!payload) return;
        if (typeof onStatusViewReceived === 'function') {
          onStatusViewReceived(payload);
        }
      })
      // Read Receipts Broadcast (turns ticks blue)
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        if (!payload) return;
        if (typeof onMessagesRead === 'function') {
          onMessagesRead(payload);
        }
      })
      // Live Emoji Reaction Broadcast
      .on('broadcast', { event: 'message_reaction' }, ({ payload }) => {
        if (!payload) return;
        if (typeof onMessageReaction === 'function') {
          onMessageReaction(payload);
        }
      })
      // Live User Status Emoji & Text Broadcast
      .on('broadcast', { event: 'user_status_updated' }, ({ payload }) => {
        if (!payload) return;
        if (typeof onUserStatusUpdated === 'function') {
          onUserStatusUpdated(payload);
        }
      })
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

  async broadcastMessage(messagePayload) {
    if (globalRealtimeChannel) {
      try {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'bloom_message',
          payload: messagePayload,
        });
      } catch (err) {
        console.warn('Broadcast send notice:', err);
      }
    }
  },

  async broadcastStatus(statusPayload) {
    if (globalRealtimeChannel) {
      try {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'bloom_status',
          payload: statusPayload,
        });
      } catch (err) {
        console.warn('Broadcast status notice:', err);
      }
    }
  },

  async broadcastStatusView(viewPayload) {
    if (globalRealtimeChannel) {
      try {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'bloom_status_view',
          payload: viewPayload,
        });
      } catch (err) {
        console.warn('Broadcast status view notice:', err);
      }
    }
  },

  // ==============================================================================
  // 5. CACHE HELPERS (Offline & Fast Reload Resilience)
  // ==============================================================================

  saveMessagesToCache(conversationId, messages) {
    try {
      if (!conversationId) return;
      localStorage.setItem(`bloom_msgs_${conversationId}`, JSON.stringify(messages || []));
    } catch (e) {}
  },

  getMessagesFromCache(conversationId) {
    try {
      if (!conversationId) return [];
      const saved = localStorage.getItem(`bloom_msgs_${conversationId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  saveConversationsToCache(userKey, conversations) {
    try {
      if (!userKey) return;
      localStorage.setItem(`bloom_convs_${userKey}`, JSON.stringify(conversations || []));
    } catch (e) {}
  },

  getConversationsFromCache(userKey) {
    try {
      if (!userKey) return [];
      const saved = localStorage.getItem(`bloom_convs_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  saveMyStatusesToCache(userKey, statuses) {
    try {
      if (!userKey) return;
      localStorage.setItem(`bloom_my_status_${userKey}`, JSON.stringify(statuses || []));
    } catch (e) {}
  },

  getMyStatusesFromCache(userKey) {
    try {
      if (!userKey) return [];
      const saved = localStorage.getItem(`bloom_my_status_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  saveContactStatusesToCache(statuses) {
    try {
      localStorage.setItem('bloom_contact_statuses', JSON.stringify(statuses || []));
    } catch (e) {}
  },

  getContactStatusesFromCache() {
    try {
      const saved = localStorage.getItem('bloom_contact_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },
};
