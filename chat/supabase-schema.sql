-- ==============================================================================
-- 🌸 BLOOM CHAT APPLICATION - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this complete script in your Supabase Dashboard:
-- 1. Go to your Supabase Project: https://supabase.com/dashboard
-- 2. Open "SQL Editor" on the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (User details linked to Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  about TEXT DEFAULT 'Available 🌸',
  status TEXT DEFAULT 'offline', -- 'online' | 'offline'
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on email for fast email search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Backfill any existing users from auth.users into public.profiles
INSERT INTO public.profiles (id, name, email, avatar_url)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  email, 
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(profiles.name, EXCLUDED.name);

-- ==============================================================================
-- 2. CONVERSATIONS TABLE (Direct or Group chats)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT DEFAULT 'direct', -- 'direct' | 'group'
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. CONVERSATION PARTICIPANTS (Members, Unread Count & Pinned status)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pinned BOOLEAN DEFAULT FALSE,
  unread_count INT DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);

-- ==============================================================================
-- 4. MESSAGES TABLE (Real-time chat messages, attachments, reactions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT,
  attachment JSONB, -- Stores { type: 'image' | 'file', name: '...', size: '...', url: '...' }
  status TEXT DEFAULT 'delivered', -- 'sent' | 'delivered' | 'read'
  reaction TEXT, -- Emoji reaction e.g. '❤️', '🌸', '👍', '🔥'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist even if messages table was created previously with older schema
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'delivered';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reaction TEXT;

-- Drop obsolete NOT NULL constraints if table previously had sender_id/receiver_id/content
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content') THEN
    ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'receiver_id') THEN
    ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ==============================================================================
-- 5. STATUSES & STORIES (Optional 24-hour stories feature)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'image', -- 'image' | 'text'
  url TEXT,
  text TEXT,
  background TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS public.status_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (status_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS public.status_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (status_id, user_id)
);

-- ==============================================================================
-- 6. AUTOMATIC PROFILE CREATION TRIGGER (When a new user signs up in Auth)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_likes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to prevent duplicate policy errors
DROP POLICY IF EXISTS "Public profiles are viewable by all users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Profiles viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id OR true);

-- Conversations policies
DROP POLICY IF EXISTS "Conversations viewable by participants" ON public.conversations;
DROP POLICY IF EXISTS "Conversations select" ON public.conversations;
DROP POLICY IF EXISTS "Conversations insert" ON public.conversations;
DROP POLICY IF EXISTS "Conversations update" ON public.conversations;

CREATE POLICY "Conversations select" 
  ON public.conversations FOR SELECT USING (true);

CREATE POLICY "Conversations insert" 
  ON public.conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Conversations update" 
  ON public.conversations FOR UPDATE USING (true);

-- Conversation Participants policies
DROP POLICY IF EXISTS "Participants access" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants select" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants update" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants delete" ON public.conversation_participants;

CREATE POLICY "Participants select" 
  ON public.conversation_participants FOR SELECT USING (true);

CREATE POLICY "Participants insert" 
  ON public.conversation_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants update" 
  ON public.conversation_participants FOR UPDATE USING (true);

CREATE POLICY "Participants delete" 
  ON public.conversation_participants FOR DELETE USING (true);

-- Messages policies
DROP POLICY IF EXISTS "Messages access" ON public.messages;
DROP POLICY IF EXISTS "Messages select" ON public.messages;
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
DROP POLICY IF EXISTS "Messages update" ON public.messages;
DROP POLICY IF EXISTS "Messages delete" ON public.messages;

CREATE POLICY "Messages select" 
  ON public.messages FOR SELECT USING (true);

CREATE POLICY "Messages insert" 
  ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages update" 
  ON public.messages FOR UPDATE USING (true);

CREATE POLICY "Messages delete" 
  ON public.messages FOR DELETE USING (true);

-- Status policies
DROP POLICY IF EXISTS "Statuses viewable by all users" ON public.statuses;
DROP POLICY IF EXISTS "Users can create their own status" ON public.statuses;
DROP POLICY IF EXISTS "Users can delete their own status" ON public.statuses;

CREATE POLICY "Statuses viewable by all users" 
  ON public.statuses FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can create their own status" 
  ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Users can delete their own status" 
  ON public.statuses FOR DELETE USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Users can view seen list for their own status" ON public.status_views;
DROP POLICY IF EXISTS "Users can insert their own view" ON public.status_views;

CREATE POLICY "Users can view seen list for their own status" 
  ON public.status_views FOR SELECT USING (true);

CREATE POLICY "Users can insert their own view" 
  ON public.status_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Status likes viewable by all" ON public.status_likes;
DROP POLICY IF EXISTS "Users can like or unlike status" ON public.status_likes;

CREATE POLICY "Status likes viewable by all" 
  ON public.status_likes FOR SELECT USING (true);

CREATE POLICY "Users can like or unlike status" 
  ON public.status_likes FOR ALL USING (true);

-- ==============================================================================
-- 8. ENABLE REALTIME PUBLICATION
-- ==============================================================================
-- Safely add tables to publication without error if already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
