-- Beta testing signup table
CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL,
  problem TEXT NOT NULL,
  frequency VARCHAR(20),
  areas TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  signed_up_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);
CREATE INDEX IF NOT EXISTS idx_beta_signups_role ON beta_signups(role);
CREATE INDEX IF NOT EXISTS idx_beta_signups_status ON beta_signups(status);
CREATE INDEX IF NOT EXISTS idx_beta_signups_signed_up ON beta_signups(signed_up_at);

-- Daily survey responses
CREATE TABLE IF NOT EXISTS beta_surveys_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id UUID REFERENCES beta_signups(id) ON DELETE CASCADE,
  date_sent DATE,
  mood VARCHAR(10),
  what_worked TEXT,
  what_failed TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Weekly survey responses
CREATE TABLE IF NOT EXISTS beta_surveys_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id UUID REFERENCES beta_signups(id) ON DELETE CASCADE,
  week_number INT,
  overall_rating INT,
  easiest_part TEXT,
  most_confusing TEXT,
  what_surprised TEXT,
  missing_feature TEXT,
  would_use_regularly BOOLEAN,
  would_recommend INT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Beta testing issues/bugs
CREATE TABLE IF NOT EXISTS beta_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id UUID REFERENCES beta_signups(id) ON DELETE CASCADE,
  severity VARCHAR(20),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  steps_to_reproduce TEXT,
  status VARCHAR(20) DEFAULT 'new',
  reported_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
