import React, { useState, useEffect, useRef } from 'react';
import AuthPage from './components/AuthPage';
import BottomNavigationFooter from './components/BottomNavigationFooter';
import Sidebar from './components/Sidebar';
import StatusSidebar from './components/StatusSidebar';
import ChatHeader from './components/ChatHeader';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import EmptyState from './components/EmptyState';
import UserProfileModal from './components/UserProfileModal';
import CallModal from './components/CallModal';
import CameraModal from './components/CameraModal';
import StatusViewerModal from './components/StatusViewerModal';
import CreateStatusModal from './components/CreateStatusModal';
import NewChatModal from './components/NewChatModal';
import { authService } from './services/authService.js';
import {
  chatService,
  stringToUuid,
  getEmailUuid,
  cleanPhoneNumber,
  isContactOnline,
} from './services/chatService.js';
import './testSupabase';
import { CURRENT_USER } from './data/mockData';

export default function App() {
  // Restore authenticated session from localStorage on refresh
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed?.isAuthenticated);
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.user || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [activeNavTab, setActiveNavTab] = useState('chats'); // 'chats' | 'status'

  // Current User Details
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.user) {
          const userMeta = parsed.user.user_metadata || {};
          const cleanEmail = parsed.user.email || CURRENT_USER.email;
          const userUid =
            userMeta.userId ||
            parsed.user.userId ||
            cleanEmail.split('@')[0] ||
            CURRENT_USER.userId ||
            'user';

          return {
            ...CURRENT_USER,
            id: parsed.user.id || CURRENT_USER.id,
            email: cleanEmail,
            userId: userUid,
            phone:
              userMeta.phone ||
              parsed.user.phone ||
              CURRENT_USER.phone ||
              '',
            name:
              userMeta.name ||
              cleanEmail.split('@')[0] ||
              CURRENT_USER.name,
            avatar: userMeta.avatar || CURRENT_USER.avatar || '',
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return CURRENT_USER;
  });

  // Real Presence Tracking State (Sets of active online IDs, emails, usernames, phones)
  const [presenceState, setPresenceState] = useState({
    onlineUserIds: new Set(),
    onlineEmails: new Set(),
    onlineUsernames: new Set(),
    onlinePhones: new Set(),
  });

  // Load conversations and their cached messages (Zero-loss guarantee, NO fake contacts)
  const [conversations, setConversations] = useState(() => {
    try {
      const savedSession = localStorage.getItem('bloom_auth_session');
      const user = savedSession ? JSON.parse(savedSession)?.user : null;
      const userId = user?.id || 'current_user';
      const cached = chatService.getConversationsFromCache(userId);

      if (cached && cached.length > 0) {
        return cached.map((c) => ({
          ...c,
          user: {
            ...c.user,
            status: 'offline', // Default offline until verified live
          },
          messages: chatService.getMessagesFromCache(c.id) || [],
        }));
      }
    } catch (e) {
      console.warn('Initial conversation load error:', e);
    }
    // Clean empty start - No fake contacts!
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState(() => {
    try {
      const savedSession = localStorage.getItem('bloom_auth_session');
      const user = savedSession ? JSON.parse(savedSession)?.user : null;
      const userId = user?.id || 'current_user';
      const cached = chatService.getConversationsFromCache(userId);
      if (cached && cached[0]?.id) return cached[0].id;
    } catch (e) {}
    return null;
  });

  const [isTyping, setIsTyping] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [callData, setCallData] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Status & Camera States (100% Real, Zero Dummy Data)
  const [contactStatuses, setContactStatuses] = useState(() => {
    return chatService.getContactStatusesFromCache() || [];
  });
  const [myStatuses, setMyStatuses] = useState(() => {
    try {
      const savedSession = localStorage.getItem('bloom_auth_session');
      const email = savedSession ? JSON.parse(savedSession)?.user?.email : null;
      return chatService.getMyStatusesFromCache(email) || [];
    } catch (e) {
      return [];
    }
  });

  // Reload user's saved statuses when currentUser changes
  useEffect(() => {
    if (currentUser?.email) {
      const loaded = chatService.getMyStatusesFromCache(currentUser.email);
      if (loaded) setMyStatuses(loaded);
    }
  }, [currentUser?.email]);
  const [viewedStatusIds, setViewedStatusIds] = useState([]);
  const [viewingStatus, setViewingStatus] = useState(null);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  // Ref to hold latest activeConversationId to prevent stale closures in subscriptions
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Clean URL on load without interfering with browser reload
  useEffect(() => {
    if (window.location.hash === '#' || window.location.hash === '#bloom') {
      window.history.replaceState(null, '', window.location.pathname || '/');
    }
  }, []);

  // Sync and restore session with Supabase Auth on mount / refresh
  useEffect(() => {
    authService
      .getSession()
      .then((session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setAuthenticatedUser(session.user);
          const meta = session.user.user_metadata || {};
          const cleanEmail = session.user.email || '';
          const userUid =
            meta.userId ||
            session.user.userId ||
            cleanEmail.split('@')[0] ||
            'user';

          setCurrentUser((prev) => ({
            ...prev,
            id: session.user.id || prev.id,
            email: cleanEmail || prev.email,
            userId: userUid,
            phone:
              meta.phone ||
              session.user.phone ||
              prev.phone ||
              '',
            name:
              meta.name ||
              cleanEmail.split('@')[0] ||
              prev.name,
            avatar: meta.avatar || prev.avatar || '',
          }));
          localStorage.setItem(
            'bloom_auth_session',
            JSON.stringify({ isAuthenticated: true, user: session.user })
          );
        }
      })
      .catch(() => {});

    // Listen to real-time auth changes
    const { data: authSub } = authService.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setIsAuthenticated(true);
        setAuthenticatedUser(session.user);
        const meta = session.user.user_metadata || {};
        const cleanEmail = session.user.email || '';
        const userUid =
          meta.userId ||
          session.user.userId ||
          cleanEmail.split('@')[0] ||
          'user';

        setCurrentUser((prev) => ({
          ...prev,
          id: session.user.id || prev.id,
          email: cleanEmail || prev.email,
          userId: userUid,
          phone:
            meta.phone ||
            session.user.phone ||
            prev.phone ||
            '',
          name:
            meta.name ||
            cleanEmail.split('@')[0] ||
            prev.name,
          avatar: meta.avatar || prev.avatar || '',
        }));
        localStorage.setItem(
          'bloom_auth_session',
          JSON.stringify({ isAuthenticated: true, user: session.user })
        );
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAuthenticatedUser(null);
        localStorage.removeItem('bloom_auth_session');
      }
    });

    return () => {
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  // Real-Time Online Presence + Realtime Direct Messaging + Live Statuses Hub
  useEffect(() => {
    if (!currentUser?.email && !currentUser?.id) return;

    // Connect to Unified Real-Time Hub for presence and live broadcasts
    const cleanupHub = chatService.initRealtimeHub(currentUser, {
      onPresenceChange: ({ onlineUserIds, onlineEmails }) => {
        const newPresence = { onlineUserIds, onlineEmails };
        setPresenceState(newPresence);

        setConversations((prev) =>
          prev.map((conv) => {
            const isOnline = isContactOnline(conv.user, newPresence);
            const liveStatus = isOnline ? 'online' : 'offline';
            if (conv.user.status !== liveStatus) {
              return {
                ...conv,
                user: {
                  ...conv.user,
                  status: liveStatus,
                },
              };
            }
            return conv;
          })
        );
      },
      onMessageReceived: (incomingMsg, { isSender, isReceiver }) => {
        if (isSender) return;

        const targetConvId = incomingMsg.conversationId;
        const otherEmail = incomingMsg.senderEmail?.toLowerCase().trim();
        const otherId = incomingMsg.senderId;

        setConversations((prev) => {
          let targetConv = prev.find(
            (c) =>
              (targetConvId && c.id === targetConvId) ||
              (otherEmail && c.user.email?.toLowerCase() === otherEmail) ||
              c.user.id === otherId ||
              c.id === otherId
          );

          let updatedList;
          if (!targetConv) {
            const contactEmail = otherEmail || '';
            const convId = targetConvId || (contactEmail ? getEmailUuid(contactEmail) : otherId);
            const isOnlineNow = isContactOnline(
              { id: convId, email: contactEmail },
              presenceState
            );

            targetConv = {
              id: convId,
              user: {
                id: otherId || convId,
                name: incomingMsg.senderName || contactEmail.split('@')[0] || 'Bloom Contact 🌸',
                email: contactEmail,
                avatar: incomingMsg.senderAvatar || '',
                status: isOnlineNow ? 'online' : 'offline',
                about: 'Available 🌸',
              },
              unreadCount: isReceiver && activeConversationIdRef.current !== convId ? 1 : 0,
              pinned: false,
              pinnedMessageId: null,
              lastActivity: Date.now(),
              messages: [incomingMsg],
            };
            updatedList = [targetConv, ...prev];
          } else {
            const alreadyExists = targetConv.messages.some(
              (m) =>
                m.id === incomingMsg.id ||
                (m.senderId === incomingMsg.senderId &&
                  m.text === incomingMsg.text &&
                  Math.abs(new Date(m.created_at || 0) - new Date(incomingMsg.created_at || 0)) < 4000)
            );

            if (alreadyExists) return prev;

            const isCurrentActive = activeConversationIdRef.current === targetConv.id;
            if (isCurrentActive) {
              incomingMsg.status = 'read';
              chatService.markMessagesAsRead(targetConv.id, currentUser.id);
            }

            const updatedMsgs = [...targetConv.messages, incomingMsg];

            targetConv = {
              ...targetConv,
              lastActivity: Date.now(),
              unreadCount:
                isReceiver && !isCurrentActive
                  ? (targetConv.unreadCount || 0) + 1
                  : 0,
              messages: updatedMsgs,
            };

            updatedList = prev.map((c) => (c.id === targetConv.id ? targetConv : c));
          }

          chatService.saveMessagesToCache(targetConv.id, targetConv.messages);
          chatService.saveConversationsToCache(currentUser.id, updatedList);
          return updatedList;
        });
      },
      onStatusReceived: (newStatusPayload) => {
        setContactStatuses((prev) => {
          const filtered = prev.filter(
            (s) => s.userEmail?.toLowerCase() !== newStatusPayload.userEmail?.toLowerCase()
          );
          const updated = [newStatusPayload, ...filtered];
          chatService.saveContactStatusesToCache(updated);
          return updated;
        });
      },
      onStatusViewReceived: ({ statusId, storyId, viewer }) => {
        setMyStatuses((prev) => {
          const updated = prev.map((st) => {
            const updatedStories = st.stories.map((story) => {
              if (!storyId || story.id === storyId) {
                const currentViewers = story.viewers || [];
                const already = currentViewers.some(
                  (v) => v.email?.toLowerCase() === viewer.email?.toLowerCase()
                );
                if (!already) {
                  return {
                    ...story,
                    viewers: [viewer, ...currentViewers],
                  };
                }
              }
              return story;
            });
            return { ...st, stories: updatedStories };
          });
          chatService.saveMyStatusesToCache(currentUser.email, updated);
          return updated;
        });
      },
      // Real-time Read Receipts: Sender receives notification that recipient opened chat
      onMessagesRead: ({ conversationId, readerId }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              const updatedMsgs = c.messages.map((m) =>
                m.senderId !== readerId ? { ...m, status: 'read' } : m
              );
              chatService.saveMessagesToCache(conversationId, updatedMsgs);
              return { ...c, messages: updatedMsgs };
            }
            return c;
          })
        );
      },
      // Real-time Emoji Reactions
      onMessageReaction: ({ messageId, conversationId, reaction }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              const updatedMsgs = c.messages.map((m) =>
                m.id === messageId ? { ...m, reaction } : m
              );
              chatService.saveMessagesToCache(conversationId, updatedMsgs);
              return { ...c, messages: updatedMsgs };
            }
            return c;
          })
        );
      },
      // Real-time Status Emoji & Text updates
      onUserStatusUpdated: ({ userId, statusEmoji, statusText }) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.user.id === userId || c.user.userId === userId) {
              return {
                ...c,
                user: {
                  ...c.user,
                  status_emoji: statusEmoji,
                  status_text: statusText,
                  about: statusText,
                },
              };
            }
            return c;
          })
        );
      },
    });

    return () => {
      if (typeof cleanupHub === 'function') cleanupHub();
    };
  }, [currentUser?.email, currentUser?.id]);

  // Load conversations from Supabase on mount/auth change
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'current_user') return;

    chatService.ensureProfile(currentUser);

    chatService.fetchUserConversations(currentUser.id).then((remoteConvs) => {
      if (remoteConvs && remoteConvs.length > 0) {
        setConversations((prev) => {
          const map = new Map();
          remoteConvs.forEach((rc) => {
            const key = (rc.user?.userId || rc.user?.id || rc.id).toLowerCase().trim();
            map.set(key, rc);
          });
          prev.forEach((pc) => {
            const key = (pc.user?.userId || pc.user?.id || pc.id).toLowerCase().trim();
            if (!map.has(key)) {
              map.set(key, pc);
            }
          });
          const merged = Array.from(map.values());
          chatService.saveConversationsToCache(currentUser.id, merged);
          return merged;
        });

        setActiveConversationId((curr) => curr || remoteConvs[0]?.id || null);
      }
    });
  }, [currentUser?.id]);

  // Realtime Postgres Changes Subscription for the Active Conversation
  useEffect(() => {
    if (!activeConversationId) return;

    // 1. Mark unread messages in the active chat as read (WhatsApp-style double blue ticks)
    if (currentUser?.id) {
      chatService.markMessagesAsRead(activeConversationId, currentUser.id);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            const updated = c.messages.map((m) =>
              m.senderId !== currentUser.id && m.status !== 'read'
                ? { ...m, status: 'read' }
                : m
            );
            return { ...c, messages: updated, unreadCount: 0 };
          }
          return c;
        })
      );
    }

    // 2. Fetch full message history from Supabase
    chatService.fetchMessagesForConversation(activeConversationId).then((dbMsgs) => {
      if (dbMsgs && dbMsgs.length > 0) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversationId) {
              const map = new Map(c.messages.map((m) => [m.id, m]));
              dbMsgs.forEach((m) => map.set(m.id, m));
              const combined = Array.from(map.values()).sort(
                (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
              );
              chatService.saveMessagesToCache(activeConversationId, combined);
              return { ...c, messages: combined, unreadCount: 0 };
            }
            return c;
          })
        );
      }
    });

    // 3. Realtime subscription on public.messages for this conversation
    const cleanupSub = chatService.subscribeToConversationMessages(
      activeConversationId,
      // onMessageReceived (INSERT)
      (newMsg) => {
        // If message is from other user and chat is open, immediately mark as read
        if (newMsg.senderId !== currentUser?.id) {
          newMsg.status = 'read';
          if (currentUser?.id) {
            chatService.markMessagesAsRead(activeConversationId, currentUser.id);
          }
        }

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversationId) {
              const alreadyHas = c.messages.some(
                (m) =>
                  m.id === newMsg.id ||
                  (m.senderId === newMsg.senderId &&
                    m.text === newMsg.text &&
                    Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0)) < 4000)
              );

              if (alreadyHas) {
                const updated = c.messages.map((m) =>
                  m.senderId === newMsg.senderId &&
                  m.text === newMsg.text &&
                  m.id.startsWith('msg-')
                    ? { ...newMsg }
                    : m
                );
                chatService.saveMessagesToCache(activeConversationId, updated);
                return { ...c, messages: updated };
              }

              const updatedMsgs = [...c.messages, newMsg];
              chatService.saveMessagesToCache(activeConversationId, updatedMsgs);
              return {
                ...c,
                lastActivity: Date.now(),
                messages: updatedMsgs,
                unreadCount: 0,
              };
            }
            return c;
          })
        );
      },
      // onMessageUpdated (UPDATE e.g. status changed to 'read' or reaction updated)
      (updatedMsg) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversationId) {
              const updated = c.messages.map((m) =>
                m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
              );
              chatService.saveMessagesToCache(activeConversationId, updated);
              return { ...c, messages: updated };
            }
            return c;
          })
        );
      }
    );

    return () => {
      if (typeof cleanupSub === 'function') cleanupSub();
    };
  }, [activeConversationId, currentUser?.id]);

  // Handle Logout
  const handleLogout = async () => {
    localStorage.removeItem('bloom_auth_session');
    sessionStorage.clear();
    setIsAuthenticated(false);
    setAuthenticatedUser(null);
    try {
      await authService.signOut();
    } catch (e) {
      console.warn('Signout error:', e);
    }
  };

  // If not authenticated, display the Login & Forgot Password screen
  if (!isAuthenticated) {
    return (
      <AuthPage
        onLoginSuccess={(user) => {
          setAuthenticatedUser(user);
          setIsAuthenticated(true);
          localStorage.setItem(
            'bloom_auth_session',
            JSON.stringify({ isAuthenticated: true, user })
          );
          if (user) {
            const meta = user.user_metadata || {};
            const cleanEmail = user.email || '';
            const userUid =
              meta.userId ||
              user.userId ||
              cleanEmail.split('@')[0] ||
              'user';

            setCurrentUser((prev) => ({
              ...prev,
              id: user.id || prev.id,
              email: cleanEmail || prev.email,
              userId: userUid,
              phone: meta.phone || user.phone || prev.phone || '',
              name: meta.name || cleanEmail.split('@')[0] || prev.name,
              avatar: meta.avatar || prev.avatar || '',
            }));
          }
        }}
      />
    );
  }

  // Active conversation object
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // Select a conversation
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setShowMobileChat(true);

    // Mark unread messages as read
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === id && (conv.unreadCount > 0 || conv.messages.some((m) => m.status !== 'read'))) {
          const updatedMsgs = conv.messages.map((m) => ({ ...m, status: 'read' }));
          chatService.saveMessagesToCache(conv.id, updatedMsgs);
          return {
            ...conv,
            unreadCount: 0,
            messages: updatedMsgs,
          };
        }
        return conv;
      });
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });
  };

  // Send a new message (text and/or attachment from local files)
  // Saved immediately to LocalStorage and synced via Supabase Database and Realtime
  const handleSendMessage = async (text, attachment = null) => {
    if ((!text && !attachment) || !activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const nowTimestamp = Date.now();
    const tempMsgId = `msg-${nowTimestamp}-${Math.random().toString(36).slice(2, 6)}`;
    const myId = currentUser.id || 'current_user';
    const myEmail = (currentUser.email || '').toLowerCase().trim();

    const isReceiverOnline = isContactOnline(currentConv.user, presenceState);
    const initialStatus = isReceiverOnline ? 'delivered' : 'sent';

    const newMessage = {
      id: tempMsgId,
      conversationId: activeConversationId,
      senderId: myId,
      senderEmail: myEmail,
      senderName: currentUser.name || myEmail.split('@')[0],
      text: text || '',
      attachment: attachment || null,
      timestamp: timeString,
      date: 'Today',
      status: initialStatus, // 'sent' (single grey tick) or 'delivered' (double grey ticks)
      created_at: now.toISOString(),
    };

    // 1. Immediate optimistic UI update + LocalStorage save (zero-deletion guarantee)
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeConversationId) {
          const updatedMsgs = [...conv.messages, newMessage];
          chatService.saveMessagesToCache(conv.id, updatedMsgs);
          return {
            ...conv,
            lastActivity: nowTimestamp,
            messages: updatedMsgs,
          };
        }
        return conv;
      });
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });

    // 2. Persist to Supabase Database & Broadcast
    try {
      const saved = await chatService.sendMessage({
        conversationId: activeConversationId,
        senderId: myId,
        senderEmail: myEmail,
        senderName: currentUser.name || myEmail.split('@')[0],
        text: text || '',
        attachment,
        status: initialStatus,
      });

      if (saved && saved.id) {
        // Upgrade temporary optimistic ID to confirmed database ID
        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.id === activeConversationId) {
              const updatedMsgs = conv.messages.map((m) =>
                m.id === tempMsgId ? { ...m, id: saved.id, created_at: saved.created_at } : m
              );
              chatService.saveMessagesToCache(conv.id, updatedMsgs);
              return { ...conv, messages: updatedMsgs };
            }
            return conv;
          });
          chatService.saveConversationsToCache(currentUser.id, updated);
          return updated;
        });
      }
    } catch (err) {
      console.warn('Realtime send exception:', err);
    }
  };

  // Start a new chat or open existing chat with a selected registered user
  const handleStartNewChat = async (contactData) => {
    if (!contactData) return;

    const targetEmail = (contactData.email || '').toLowerCase().trim();
    const targetUserId = contactData.id;

    if (!targetEmail && !targetUserId) return;

    // 1. Check if conversation already exists with this user (prevent duplicate contacts!)
    const existing = conversations.find((c) => {
      if (targetUserId && (c.user?.id === targetUserId || c.id === targetUserId)) {
        return true;
      }
      if (targetEmail && c.user?.email && c.user.email.toLowerCase().trim() === targetEmail) {
        return true;
      }
      return false;
    });

    if (existing) {
      setActiveConversationId(existing.id);
      setShowMobileChat(true);
      return;
    }

    // 2. Get or create 1-to-1 conversation in Supabase
    let convId;
    try {
      if (currentUser?.id && targetUserId) {
        convId = await chatService.getOrCreateDirectConversation(currentUser.id, targetUserId);
      }
    } catch (e) {
      console.warn('getOrCreateDirectConversation error:', e);
    }

    if (!convId) {
      convId = targetEmail ? getEmailUuid(targetEmail) : (targetUserId || `conv-${Date.now()}`);
    }

    // 3. Verify online status
    const isOnlineNow = isContactOnline(
      { id: targetUserId || convId, email: targetEmail },
      presenceState
    );

    const newConv = {
      id: convId,
      user: {
        id: targetUserId || convId,
        name: contactData.name || contactData.userId || targetEmail.split('@')[0] || 'user',
        userId: (contactData.userId || contactData.name || targetEmail.split('@')[0] || 'user').replace(/^@/, ''),
        email: targetEmail,
        avatar: contactData.avatar_url || contactData.avatar || '',
        about: contactData.about || 'Available 🌸',
        status: isOnlineNow ? 'online' : 'offline',
      },
      unreadCount: 0,
      pinned: false,
      pinnedMessageId: null,
      lastActivity: Date.now(),
      messages: chatService.getMessagesFromCache(convId) || [],
    };

    setConversations((prev) => {
      // Filter out any potential duplicates by email or user ID
      const filtered = prev.filter(
        (c) =>
          c.id !== convId &&
          (c.user?.email || '').toLowerCase().trim() !== targetEmail
      );
      const updated = [newConv, ...filtered];
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });

    setActiveConversationId(convId);
    setShowMobileChat(true);

    // Fetch messages for new conversation
    chatService.fetchMessagesForConversation(convId).then((remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id === convId) {
              chatService.saveMessagesToCache(convId, remoteMsgs);
              return { ...c, messages: remoteMsgs };
            }
            return c;
          });
          chatService.saveConversationsToCache(currentUser.id, updated);
          return updated;
        });
      }
    });
  };

  // Mute / Unmute a conversation
  const handleToggleMuteConversation = async (convId) => {
    if (!convId) return;
    let newMuted = false;
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === convId) {
          newMuted = !c.muted;
          return { ...c, muted: newMuted };
        }
        return c;
      });
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });

    if (currentUser?.id) {
      await chatService.toggleMuteConversation(convId, currentUser.id, newMuted);
    }
  };

  // Delete conversation for current user (per-user soft delete)
  const handleDeleteConversation = async (convId, contactName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this conversation with ${contactName || 'this contact'}? This will remove the chat from your list while preserving it for the other user.`
    );
    if (!confirmDelete) return;

    if (currentUser?.id) {
      await chatService.hideConversationForUser(convId, currentUser.id);
    }

    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== convId);
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });

    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setShowMobileChat(false);
    }
  };

  // Add/toggle reaction on a message (Saved in Supabase & broadcast in real time)
  const handleAddReaction = async (messageId, emoji) => {
    if (!messageId) return;

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeConversationId) {
          const updatedMsgs = conv.messages.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reaction: msg.reaction === emoji ? null : emoji,
              };
            }
            return msg;
          });
          chatService.saveMessagesToCache(conv.id, updatedMsgs);
          return {
            ...conv,
            messages: updatedMsgs,
          };
        }
        return conv;
      });
      return updated;
    });

    if (currentUser?.id) {
      await chatService.toggleMessageReaction({
        messageId,
        conversationId: activeConversationId,
        currentUserId: currentUser.id,
        emoji,
      });
    }
  };

  // Safeguarded Clear Chat (Keeps messages safe from accidental deletion)
  const handleClearChat = () => {
    if (!activeConversationId) return;
    const confirmClear = window.confirm(
      'Are you sure you want to clear your messages in this conversation?'
    );
    if (!confirmClear) return;

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeConversationId) {
          chatService.saveMessagesToCache(conv.id, []);
          return {
            ...conv,
            messages: [],
            unreadCount: 0,
          };
        }
        return conv;
      });
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });
  };

  // Toggle Pin / Unpin conversation (Saved permanently)
  const handleTogglePin = (id) => {
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === id) {
          return {
            ...conv,
            pinned: !conv.pinned,
          };
        }
        return conv;
      });
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });
  };

  // Toggle Pin / Unpin a specific message inside the active chat (Saved permanently)
  const handleTogglePinMessage = (messageId) => {
    if (!activeConversationId) return;
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeConversationId) {
          const isCurrentlyPinned = conv.pinnedMessageId === messageId;
          return {
            ...conv,
            pinnedMessageId: isCurrentlyPinned ? null : messageId,
          };
        }
        return conv;
      });
      chatService.saveConversationsToCache(currentUser.id, updated);
      return updated;
    });
  };

  // Audio/video call trigger
  const handleTriggerCall = (type, name) => {
    if (!activeConversation) return;
    setCallData({
      type,
      name,
      avatar: activeConversation.user.avatar,
    });
  };

  // Handle current user profile update
  const handleUpdateCurrentUser = async (updatedUser) => {
    setCurrentUser(updatedUser);
    setProfileModalUser(updatedUser);

    if (currentUser?.id && (updatedUser.status_emoji || updatedUser.status_text)) {
      await chatService.updateUserStatus(currentUser.id, {
        statusEmoji: updatedUser.status_emoji,
        statusText: updatedUser.status_text,
      });
    }

    try {
      const saved = localStorage.getItem('bloom_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.user = {
          ...parsed.user,
          user_metadata: {
            ...(parsed.user?.user_metadata || {}),
            status_emoji: updatedUser.status_emoji,
            status_text: updatedUser.status_text,
            name: updatedUser.name,
            userId: updatedUser.userId,
            avatar: updatedUser.avatar,
          },
        };
        localStorage.setItem('bloom_auth_session', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  // Post a new real status update (persisted and broadcast live)
  const handlePostNewStatus = (storyItem) => {
    const storyWithViewers = {
      ...storyItem,
      viewers: [],
      likesCount: 0,
    };
    const existingStories = myStatuses[0]?.stories || [];
    const statusId = `status-me-${Date.now()}`;
    const myEmail = (currentUser.email || '').toLowerCase().trim();

    const updatedMyStatus = {
      id: statusId,
      userId: currentUser.id,
      userEmail: myEmail,
      userName: currentUser.name || myEmail.split('@')[0],
      userAvatar: currentUser.avatar,
      timestamp: 'Just now',
      stories: [storyWithViewers, ...existingStories],
    };

    const newStatuses = [updatedMyStatus];
    setMyStatuses(newStatuses);
    chatService.saveMyStatusesToCache(myEmail, newStatuses);

    // Broadcast live status update to other connected users
    chatService.broadcastStatus({
      id: `status-${myEmail}-${Date.now()}`,
      userId: currentUser.id,
      userEmail: myEmail,
      userName: currentUser.name || myEmail.split('@')[0],
      userAvatar: currentUser.avatar,
      timestamp: 'Just now',
      stories: [storyWithViewers],
    });
  };

  // Record viewing a story in real-time
  const handleViewStory = (statusId, storyId) => {
    if (!currentUser?.email) return;
    chatService.broadcastStatusView({
      statusId,
      storyId,
      viewer: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        avatar: currentUser.avatar || '',
        time: 'Just now',
      },
    });
  };

  // Photo captured from camera directly for Status
  const handleCaptureForStatus = (imgUrl) => {
    handlePostNewStatus({
      id: `story-${Date.now()}`,
      type: 'image',
      url: imgUrl,
      caption: 'Captured with Bloom Camera 🌸',
      createdAt: 'Just now',
    });
  };

  // Photo captured from camera directly for Chat
  const handleCaptureForChat = (imgUrl) => {
    if (!activeConversationId) return;
    handleSendMessage('📷 Shared a photo', {
      type: 'image',
      name: 'Photo',
      url: imgUrl,
    });
  };

  // Reply to a contact's status
  const handleReplyStatus = (targetEmailOrId, replyText) => {
    const conv = conversations.find(
      (c) =>
        (c.user.email && c.user.email.toLowerCase() === String(targetEmailOrId).toLowerCase()) ||
        c.user.id === targetEmailOrId
    );
    if (conv) {
      setActiveNavTab('chats');
      setActiveConversationId(conv.id);
      setShowMobileChat(true);
      handleSendMessage(replyText);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* Full Window Layout */}
      <div className="flex-1 w-full h-full flex overflow-hidden relative">
        {/* Left Panel: Sidebar (Chats or Status) with All Navigation Buttons in Footer */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full flex-shrink-0 flex flex-col border-r border-violet-100/90 bg-white transition-all duration-200 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Scrollable content area: either Chats list or Status list */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {activeNavTab === 'chats' ? (
              <Sidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onTogglePin={handleTogglePin}
                onDeleteConversation={handleDeleteConversation}
                currentUser={currentUser}
                onOpenNewChat={() => setIsNewChatOpen(true)}
              />
            ) : (
              <StatusSidebar
                currentUser={currentUser}
                myStatuses={myStatuses}
                contactStatuses={contactStatuses}
                viewedStatusIds={viewedStatusIds}
                onOpenMyStatus={() => myStatuses[0] && setViewingStatus(myStatuses[0])}
                onCreateStatus={() => setIsCreateStatusOpen(true)}
                onOpenContactStatus={(st) => {
                  setViewingStatus(st);
                  if (!viewedStatusIds.includes(st.id)) {
                    setViewedStatusIds((prev) => [...prev, st.id]);
                  }
                }}
                onOpenLiveCamera={() => setIsLiveCameraOpen(true)}
              />
            )}
          </div>

          {/* Bottom Navigation Footer: Chats, Status, Camera, Profile, Sign Out */}
          <BottomNavigationFooter
            activeNavTab={activeNavTab}
            onSelectNavTab={(tab) => {
              setActiveNavTab(tab);
              if (tab === 'chats') setShowMobileChat(false);
            }}
            onOpenLiveCamera={() => setIsLiveCameraOpen(true)}
            currentUser={currentUser}
            onOpenUserProfile={() => setProfileModalUser(currentUser)}
            onLogout={handleLogout}
            unreadCount={conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
          />
        </div>

        {/* 3. Main Chat Area / Empty State */}
        <main
          className={`flex-1 h-full flex flex-col bg-white transition-all duration-200 ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              <ChatHeader
                activeUser={activeConversation.user}
                isPinned={Boolean(activeConversation.pinned)}
                isMuted={Boolean(activeConversation.muted)}
                onTogglePin={() => handleTogglePin(activeConversation.id)}
                onToggleMute={() => handleToggleMuteConversation(activeConversation.id)}
                onBackToList={() => setShowMobileChat(false)}
                onOpenProfile={() => setProfileModalUser(activeConversation.user)}
                onClearChat={handleClearChat}
                onDeleteConversation={() =>
                  handleDeleteConversation(
                    activeConversation.id,
                    activeConversation.user?.name
                  )
                }
                onTriggerCall={handleTriggerCall}
                isTyping={isTyping}
              />

              <ChatArea
                conversation={activeConversation}
                currentUser={currentUser}
                isTyping={isTyping}
                onAddReaction={handleAddReaction}
                onTogglePinMessage={handleTogglePinMessage}
              />

              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={false}
              />
            </>
          ) : (
            <EmptyState
              onSelectFirstChat={
                conversations[0]?.id
                  ? () => handleSelectConversation(conversations[0].id)
                  : null
              }
              onOpenNewChat={() => setIsNewChatOpen(true)}
            />
          )}
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={Boolean(profileModalUser)}
        user={profileModalUser}
        isCurrentUser={profileModalUser?.id === currentUser.id}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        onClose={() => setProfileModalUser(null)}
        onLogout={handleLogout}
      />

      {/* Call Modal */}
      <CallModal
        callData={callData}
        onClose={() => setCallData(null)}
      />

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCaptureForStatus={handleCaptureForStatus}
        onCaptureForChat={handleCaptureForChat}
      />

      {/* Create Status Modal (Photo/Camera/Text Story) */}
      <CreateStatusModal
        isOpen={isCreateStatusOpen}
        onClose={() => setIsCreateStatusOpen(false)}
        onPostStatus={handlePostNewStatus}
        onOpenLiveCamera={() => setIsLiveCameraOpen(true)}
      />

      {/* Full-Screen Status / Story Viewer */}
      <StatusViewerModal
        statusData={viewingStatus}
        currentUser={currentUser}
        onClose={() => setViewingStatus(null)}
        onReplyStatus={handleReplyStatus}
        onViewStory={handleViewStory}
      />

      {/* Start New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={handleStartNewChat}
        currentUser={currentUser}
      />
    </div>
  );
}
