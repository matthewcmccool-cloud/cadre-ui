-- user_bookmarks: single table for all save/follow actions (jobs, companies, investors)
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('job', 'company', 'investor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type ON user_bookmarks(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON user_bookmarks(item_id, item_type);

-- user_plans: track user subscription tier (if not already present)
CREATE TABLE IF NOT EXISTS user_plans (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
