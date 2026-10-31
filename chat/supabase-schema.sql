-- ==============================================================================
-- 🌸 BLOOM CHAT APPLICATION - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this complete script in your Supabase Dashboard:
-- 1. Go to your Supabase Project: https://supabase.com/dashboard
-- 2. Open "SQL Editor" on the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
--
-- ✉️ EMAIL TEMPLATE NOTE (Reset Password OTP):
-- In Supabase Dashboard -> Authentication -> Email Templates -> "Reset Password":
-- Ensure the template body contains {{ .Token }} to send the 6-digit OTP code:
-- Subject: 🌸 Your Bloom Password Reset OTP: {{ .Token }}
-- Body: <h2>Your 6-digit OTP code is: {{ .Token }}</h2>
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
  about TEXT DEFAULT 'At work 🌿',
  status TEXT DEFAULT 'offline', -- 'online' | 'offline'
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ==============================================================================
-- 4. MESSAGES TABLE (Real-time chat messages, attachments, double blue tick, reactions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT,
  attachment JSONB, -- Stores { type: 'image' | 'file', name: '...', size: '...', url: '...' }
  status TEXT DEFAULT 'delivered', -- 'sent' | 'delivered' | 'read' (Double Blue Tick)
  reaction TEXT, -- Emoji reaction e.g. '❤️', '🌸', '👍', '🔥'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. STATUSES TABLE (Stories with 24h expiration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'image', -- 'image' | 'text'
  url TEXT, -- Image URL
  text TEXT, -- Text story content
  background TEXT, -- Gradient background preset for text status
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ==============================================================================
-- 6. STATUS VIEWS TABLE (Views Option - Who viewed my status)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.status_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (status_id, viewer_id)
);

-- ==============================================================================
-- 7. STATUS LIKES TABLE (Like Option - Hearts on status)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.status_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (status_id, user_id)
);

-- ==============================================================================
-- 8. AUTOMATIC PROFILE CREATION TRIGGER (When a new user signs up in Auth)
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_likes ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Public profiles are viewable by all users" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Conversations viewable by participants" 
  ON public.conversations FOR ALL USING (true);

CREATE POLICY "Participants access" 
  ON public.conversation_participants FOR ALL USING (true);

CREATE POLICY "Messages access" 
  ON public.messages FOR ALL USING (true);

CREATE POLICY "Statuses viewable by all users" 
  ON public.statuses FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can create their own status" 
  ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status" 
  ON public.statuses FOR DELETE USING (auth.uid() = user_id);

-- Views Policy: Users can only see who viewed THEIR OWN status (WhatsApp privacy rule!)
CREATE POLICY "Users can view seen list for their own status" 
  ON public.status_views FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.statuses 
      WHERE statuses.id = status_views.status_id AND statuses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own view" 
  ON public.status_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Likes Policy: Anyone can view likes and add a like
CREATE POLICY "Status likes viewable by all" 
  ON public.status_likes FOR SELECT USING (true);

CREATE POLICY "Users can like or unlike status" 
  ON public.status_likes FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 10. ENABLE REALTIME PUBLICATION (For instant chat messages & status updates)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.status_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- ==============================================================================
-- 11. STORAGE BUCKET CONFIGURATION (Optional: Run in SQL or create in Dashboard)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('chat-attachments', 'chat-attachments', true),
  ('status-media', 'status-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Access" 
  ON storage.objects FOR SELECT USING (true);

CREATE POLICY "Authenticated user upload" 
  ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

