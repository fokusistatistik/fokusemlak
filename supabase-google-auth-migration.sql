-- ========================================
-- FOKUS Emlak - Google Auth & Webhook System Migration
-- Version: 3.0.0
-- Date: 2025-11-24
-- ========================================

-- This migration updates the system for:
-- 1. Google-only authentication
-- 2. Admin approval workflow
-- 3. Webhook integration

-- ========================================
-- 1. UPDATE user_profiles TABLE
-- ========================================

-- Add Google OAuth columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS google_picture TEXT;

-- Add approval workflow columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_google_id ON user_profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_google_email ON user_profiles(google_email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles(approval_status);

-- ========================================
-- 2. CREATE webhook_logs TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Event Info
  event_type TEXT NOT NULL, -- 'user_auth', 'chatbot_inquiry', 'approval_notification'
  event_action TEXT, -- 'signup', 'login', 'approved', 'rejected'

  -- Request Data
  request_payload JSONB,
  request_headers JSONB,

  -- Response Data
  response_payload JSONB,
  response_status INTEGER, -- HTTP status code

  -- Relations
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ========================================
-- 3. UPDATE TRIGGERS
-- ========================================

-- Update handle_new_user trigger to support Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    role,
    verified_email,
    google_id,
    google_email,
    google_picture,
    approval_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.email_confirmed_at IS NOT NULL,
    NEW.raw_user_meta_data->>'sub', -- Google user ID
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url', -- Google picture
    'pending' -- Default to pending approval
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification when user approval status changes
CREATE OR REPLACE FUNCTION notify_on_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to approved or rejected
  IF NEW.approval_status != OLD.approval_status AND NEW.approval_status IN ('approved', 'rejected') THEN

    INSERT INTO user_notifications (user_id, title, message, type, icon)
    VALUES (
      NEW.id,
      CASE NEW.approval_status
        WHEN 'approved' THEN 'Hesabınız Onaylandı! 🎉'
        WHEN 'rejected' THEN 'Hesap Onayı Hakkında'
      END,
      CASE NEW.approval_status
        WHEN 'approved' THEN 'Artık FOKUS Emlak''ı kullanmaya başlayabilirsiniz!'
        WHEN 'rejected' THEN COALESCE(NEW.rejection_reason, 'Hesabınız onaylanmadı. Daha fazla bilgi için bizimle iletişime geçin.')
      END,
      'system',
      CASE NEW.approval_status
        WHEN 'approved' THEN '✅'
        WHEN 'rejected' THEN '❌'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_approval_status_change ON user_profiles;
CREATE TRIGGER on_approval_status_change
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION notify_on_approval_status_change();

-- ========================================
-- 4. UPDATE RLS POLICIES
-- ========================================

-- Update user_profiles policies to respect approval status
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  -- Admins can view all
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only approved users can update their profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  AND approval_status = 'approved'
);

-- Only admins can update approval_status
CREATE POLICY "Admins can approve users"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- webhook_logs policies
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- System can insert webhook logs
CREATE POLICY "System can insert webhook logs"
ON webhook_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- 5. UTILITY FUNCTIONS
-- ========================================

-- Get pending users count for admin dashboard
CREATE OR REPLACE FUNCTION get_pending_users_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_profiles
    WHERE approval_status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve user function (for admin panel)
CREATE OR REPLACE FUNCTION approve_user(
  target_user_id UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if requesting user is admin
  SELECT role = 'admin' INTO is_admin
  FROM user_profiles
  WHERE id = admin_user_id;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve users';
  END IF;

  -- Update user profile
  UPDATE user_profiles
  SET
    approval_status = 'approved',
    approved_by = admin_user_id,
    approved_at = NOW()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject user function (for admin panel)
CREATE OR REPLACE FUNCTION reject_user(
  target_user_id UUID,
  admin_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if requesting user is admin
  SELECT role = 'admin' INTO is_admin
  FROM user_profiles
  WHERE id = admin_user_id;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can reject users';
  END IF;

  -- Update user profile
  UPDATE user_profiles
  SET
    approval_status = 'rejected',
    approved_by = admin_user_id,
    approved_at = NOW(),
    rejection_reason = reason
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. DATA MIGRATION
-- ========================================

-- Set existing users as approved (so they don't need re-approval)
UPDATE user_profiles
SET approval_status = 'approved',
    approved_at = created_at
WHERE approval_status IS NULL
   OR approval_status = 'pending';

-- ========================================
-- 7. CLEANUP (Optional)
-- ========================================

-- Remove unused columns if they exist (be careful!)
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS agency_name;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS license_number;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS agent_bio;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS agent_verified;

-- Drop unused tables if they exist
-- DROP TABLE IF EXISTS user_messages CASCADE;
-- DROP TABLE IF EXISTS user_offers CASCADE;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Google Auth & Webhook Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✅ user_profiles updated (Google OAuth columns)';
  RAISE NOTICE '  ✅ user_profiles updated (approval workflow)';
  RAISE NOTICE '  ✅ webhook_logs table created';
  RAISE NOTICE '  ✅ Triggers updated';
  RAISE NOTICE '  ✅ RLS policies updated';
  RAISE NOTICE '  ✅ Utility functions created';
  RAISE NOTICE '  ✅ Existing users auto-approved';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Configure Google OAuth in Supabase Dashboard';
  RAISE NOTICE '  2. Update login.html for Google-only auth';
  RAISE NOTICE '  3. Setup n8n webhooks';
  RAISE NOTICE '  4. Test approval workflow';
  RAISE NOTICE '========================================';
END $$;

-- Verify changes
SELECT
  'user_profiles columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('google_id', 'google_email', 'google_picture', 'approval_status')
ORDER BY column_name;

SELECT
  'webhook_logs exists' as check_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'webhook_logs';

SELECT
  'pending_users_count' as check_type,
  get_pending_users_count() as count;
