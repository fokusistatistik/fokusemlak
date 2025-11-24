-- ========================================
-- FOKUS Emlak - User Management Migration
-- Version: 2.0.0
-- Date: 2025-11-24
-- ========================================

-- This migration adds user management features:
-- - User profiles with roles (admin, agent, user)
-- - Favorites system
-- - Saved searches with notifications
-- - Offer management
-- - Messaging system
-- - Notifications
-- - View tracking

-- ========================================
-- 1. UPDATE EXISTING user_profiles TABLE
-- ========================================

-- Drop existing table if you want fresh start
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Alter existing table to add new columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS agency_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS agent_bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS agent_verified BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verified_email BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verified_phone BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update role check constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'agent', 'user', 'editor', 'viewer'));

-- Add account status check constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'deleted'));

-- ========================================
-- 2. CREATE NEW TABLES
-- ========================================

-- ----------------
-- Favorites Table
-- ----------------
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: user can only favorite a property once
  UNIQUE(user_id, property_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_property ON user_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created ON user_favorites(created_at DESC);

-- ----------------
-- Saved Searches Table
-- ----------------
CREATE TABLE IF NOT EXISTS user_saved_searches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Search Criteria
  search_name TEXT NOT NULL,
  city TEXT,
  district TEXT,
  transaction_type TEXT,
  property_type TEXT,
  rooms TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  area_min NUMERIC,
  area_max NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,

  -- Notifications
  notify_on_match BOOLEAN DEFAULT true,
  last_notification_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON user_saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_notify ON user_saved_searches(notify_on_match) WHERE notify_on_match = true;

-- ----------------
-- Offers Table
-- ----------------
CREATE TABLE IF NOT EXISTS user_offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Parties
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES auth.users(id), -- Property owner/agent

  -- Offer Details
  offer_price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  message TEXT,
  financing_type TEXT CHECK (financing_type IN ('cash', 'mortgage', 'mixed')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired')),
  counter_offer_price NUMERIC,
  counter_offer_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Additional
  admin_notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_user ON user_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_property ON user_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_agent ON user_offers(agent_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON user_offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created ON user_offers(created_at DESC);

-- ----------------
-- Messages Table
-- ----------------
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Thread Management
  thread_id UUID NOT NULL,

  -- Parties
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Message
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'offer', 'system')),

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  archived_by_sender BOOLEAN DEFAULT false,
  archived_by_receiver BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread ON user_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON user_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property ON user_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON user_messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON user_messages(created_at DESC);

-- ----------------
-- Notifications Table
-- ----------------
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'new_property', 'price_change', 'new_message',
    'offer_received', 'offer_accepted', 'offer_rejected',
    'property_sold', 'system'
  )),

  -- Links
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  link_url TEXT,
  icon TEXT DEFAULT '🔔',

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON user_notifications(created_at DESC);

-- ----------------
-- Property Views Table (Analytics)
-- ----------------
CREATE TABLE IF NOT EXISTS user_property_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Engagement
  time_spent_seconds INTEGER DEFAULT 0,
  photos_viewed INTEGER DEFAULT 0,
  contacted BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_views_user ON user_property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_property ON user_property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_date ON user_property_views(viewed_at DESC);

-- ========================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_property_views ENABLE ROW LEVEL SECURITY;

-- ----------------
-- user_profiles Policies
-- ----------------

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view agent profiles" ON user_profiles;
CREATE POLICY "Public can view agent profiles"
ON user_profiles FOR SELECT
TO anon, authenticated
USING (role = 'agent' AND account_status = 'active');

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ----------------
-- user_favorites Policies
-- ----------------

DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;
CREATE POLICY "Users can manage own favorites"
ON user_favorites FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------
-- user_saved_searches Policies
-- ----------------

DROP POLICY IF EXISTS "Users can manage own searches" ON user_saved_searches;
CREATE POLICY "Users can manage own searches"
ON user_saved_searches FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------
-- user_offers Policies
-- ----------------

DROP POLICY IF EXISTS "Users can view related offers" ON user_offers;
CREATE POLICY "Users can view related offers"
ON user_offers FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = agent_id);

DROP POLICY IF EXISTS "Users can create offers" ON user_offers;
CREATE POLICY "Users can create offers"
ON user_offers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Agents can respond to offers" ON user_offers;
CREATE POLICY "Agents can respond to offers"
ON user_offers FOR UPDATE
TO authenticated
USING (auth.uid() = agent_id);

-- ----------------
-- user_messages Policies
-- ----------------

DROP POLICY IF EXISTS "Users can view own messages" ON user_messages;
CREATE POLICY "Users can view own messages"
ON user_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON user_messages;
CREATE POLICY "Users can send messages"
ON user_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update message status" ON user_messages;
CREATE POLICY "Users can update message status"
ON user_messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);

-- ----------------
-- user_notifications Policies
-- ----------------

DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update notification status" ON user_notifications;
CREATE POLICY "Users can update notification status"
ON user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ----------------
-- user_property_views Policies
-- ----------------

DROP POLICY IF EXISTS "Users can view own history" ON user_property_views;
CREATE POLICY "Users can view own history"
ON user_property_views FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can log views" ON user_property_views;
CREATE POLICY "Anyone can log views"
ON user_property_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ========================================
-- 4. FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, verified_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update last_login on user login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_login = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();

-- Create notification when offer is created
CREATE OR REPLACE FUNCTION notify_on_offer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notifications (user_id, title, message, type, property_id)
  VALUES (
    NEW.agent_id,
    'Yeni Teklif Aldınız!',
    format('₺%s teklif geldi', NEW.offer_price),
    'offer_received',
    NEW.property_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_offer_created ON user_offers;
CREATE TRIGGER on_offer_created
  AFTER INSERT ON user_offers
  FOR EACH ROW EXECUTE FUNCTION notify_on_offer();

-- Notify user when offer is responded
CREATE OR REPLACE FUNCTION notify_on_offer_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected', 'countered') THEN
    INSERT INTO user_notifications (user_id, title, message, type, property_id)
    VALUES (
      NEW.user_id,
      CASE NEW.status
        WHEN 'accepted' THEN 'Teklifiniz Kabul Edildi! 🎉'
        WHEN 'rejected' THEN 'Teklifiniz Reddedildi'
        WHEN 'countered' THEN 'Karşı Teklif Aldınız'
      END,
      CASE NEW.status
        WHEN 'accepted' THEN format('₺%s teklifiniz kabul edildi', NEW.offer_price)
        WHEN 'rejected' THEN 'Teklifiniz maalesef reddedildi'
        WHEN 'countered' THEN format('Karşı teklif: ₺%s', NEW.counter_offer_price)
      END,
      'offer_' || NEW.status,
      NEW.property_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_offer_responded ON user_offers;
CREATE TRIGGER on_offer_responded
  AFTER UPDATE ON user_offers
  FOR EACH ROW EXECUTE FUNCTION notify_on_offer_response();

-- Notify on new message
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM user_profiles WHERE id = NEW.sender_id;

  INSERT INTO user_notifications (user_id, title, message, type, property_id)
  VALUES (
    NEW.receiver_id,
    'Yeni Mesaj 💬',
    format('%s size mesaj gönderdi', COALESCE(sender_name, 'Bir kullanıcı')),
    'new_message',
    NEW.property_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON user_messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON user_messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- ========================================
-- 5. UTILITY FUNCTIONS
-- ========================================

-- Get user's favorite count
CREATE OR REPLACE FUNCTION get_user_favorites_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_favorites WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's unread message count
CREATE OR REPLACE FUNCTION get_user_unread_messages_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_messages WHERE receiver_id = user_uuid AND read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's unread notification count
CREATE OR REPLACE FUNCTION get_user_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_notifications WHERE user_id = user_uuid AND read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if property is in user's favorites
CREATE OR REPLACE FUNCTION is_property_favorited(user_uuid UUID, property_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_favorites
    WHERE user_id = user_uuid AND property_id = property_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. SAMPLE DATA (Optional)
-- ========================================

-- Create sample agent user (for testing)
-- Note: This user must be created via Supabase Auth first
/*
INSERT INTO user_profiles (id, full_name, role, agency_name, phone, agent_verified)
VALUES (
  'REPLACE_WITH_ACTUAL_USER_ID',
  'Ahmet Emlakçı',
  'agent',
  'FOKUS Emlak',
  '05551234567',
  true
);
*/

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Management Migration Completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - user_favorites';
  RAISE NOTICE '  - user_saved_searches';
  RAISE NOTICE '  - user_offers';
  RAISE NOTICE '  - user_messages';
  RAISE NOTICE '  - user_notifications';
  RAISE NOTICE '  - user_property_views';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '  - Auto-create profile on signup';
  RAISE NOTICE '  - Update last_login';
  RAISE NOTICE '  - Notify on offers';
  RAISE NOTICE '  - Notify on messages';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Enable Email/Password auth in Supabase Dashboard';
  RAISE NOTICE '  2. Configure email templates';
  RAISE NOTICE '  3. Create test users';
  RAISE NOTICE '  4. Update frontend with login/signup';
  RAISE NOTICE '========================================';
END $$;
