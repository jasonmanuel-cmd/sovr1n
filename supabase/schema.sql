-- ============================================================
-- SOURC'N DATABASE SCHEMA
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- 1. USERS (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT NOT NULL DEFAULT 'Bakersfield',
  avatar_url TEXT,
  roles TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LISTINGS (Market items + Services)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('market','service')),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  price DECIMAL(10,2),
  photos TEXT[] DEFAULT '{}',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICE PROVIDERS (paid $5/mo listings)
CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  photos TEXT[] DEFAULT '{}',
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LOADS (Driver & Load Board)
CREATE TABLE public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  cargo_tier TEXT NOT NULL CHECK (cargo_tier IN ('small','medium','large','heavy')),
  weight_kg DECIMAL(10,2),
  dimensions TEXT,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  offered_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open','reserved','in_transit','delivered','disputed','cancelled'
  )),
  assigned_driver_id UUID REFERENCES public.users(id),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  confirmed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LOAD APPLICATIONS (drivers bidding on loads)
CREATE TABLE public.load_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  vehicle_capacity_kg DECIMAL(10,2),
  proposed_price DECIMAL(10,2),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','approved','rejected','withdrawn'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DRIVER VERIFICATION
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  license_photo_url TEXT,
  vehicle_registration_url TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  insurance_photo_url TEXT,
  vehicle_type TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_plate TEXT,
  capacity_kg DECIMAL(10,2),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending','under_review','verified','rejected','expired'
  )),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVIEWS & RATINGS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'driver_rating','poster_rating',
    'buyer_rating','seller_rating',
    'client_rating','provider_rating'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRANSACTIONS (payment ledger)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id),
  listing_id UUID REFERENCES public.listings(id),
  payer_id UUID NOT NULL REFERENCES public.users(id),
  payee_id UUID REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'escrow_hold','escrow_release','driver_payout',
    'subscription_charge','subscription_refund',
    'platform_fee'
  )),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','processing','completed','failed','refunded','disputed'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONVERSATIONS (chat between users)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id),
  listing_id UUID REFERENCES public.listings(id),
  participant_1 UUID NOT NULL REFERENCES public.users(id),
  participant_2 UUID NOT NULL REFERENCES public.users(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  text TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text','image','location')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SEARCH LOG (zero-result tracking)
CREATE TABLE public.search_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  query TEXT NOT NULL,
  city TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PLATFORM CONFIG
CREATE TABLE public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_listings_city ON public.listings(city);
CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_tags ON public.listings USING GIN(tags);
CREATE INDEX idx_listings_user ON public.listings(user_id);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_active ON public.listings(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_loads_city ON public.loads(city);
CREATE INDEX idx_loads_status ON public.loads(status);
CREATE INDEX idx_loads_poster ON public.loads(poster_id);
CREATE INDEX idx_loads_driver ON public.loads(assigned_driver_id);
CREATE INDEX idx_loads_cargo ON public.loads(cargo_tier);

CREATE INDEX idx_load_applications_load ON public.load_applications(load_id);
CREATE INDEX idx_load_applications_driver ON public.load_applications(driver_id);

CREATE INDEX idx_service_providers_city ON public.service_providers(city);
CREATE INDEX idx_service_providers_user ON public.service_providers(user_id);
CREATE INDEX idx_service_providers_active ON public.service_providers(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_driver_profiles_user ON public.driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_verified ON public.driver_profiles(is_verified) WHERE is_verified = TRUE;

CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_load ON public.reviews(load_id);
CREATE INDEX idx_reviews_listing ON public.reviews(listing_id);

CREATE INDEX idx_transactions_payer ON public.transactions(payer_id);
CREATE INDEX idx_transactions_load ON public.transactions(load_id);

CREATE INDEX idx_conversations_participants ON public.conversations(participant_1, participant_2);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

CREATE INDEX idx_search_log_city ON public.search_log(city);
CREATE INDEX idx_search_log_created ON public.search_log(created_at);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON public.users
  FOR SELECT USING (true);

-- LISTINGS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings are publicly readable" ON public.listings
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = user_id);

-- SERVICE PROVIDERS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers are publicly readable" ON public.service_providers
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own provider profile" ON public.service_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own provider profile" ON public.service_providers
  FOR UPDATE USING (auth.uid() = user_id);

-- LOADS
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Loads are publicly readable" ON public.loads
  FOR SELECT USING (true);
CREATE POLICY "Posters can insert loads" ON public.loads
  FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Posters can update own loads" ON public.loads
  FOR UPDATE USING (auth.uid() = poster_id);
CREATE POLICY "Drivers can update assigned loads" ON public.loads
  FOR UPDATE USING (
    auth.uid() = assigned_driver_id AND status IN ('reserved','in_transit')
  );

-- LOAD APPLICATIONS
ALTER TABLE public.load_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posters can view applications for their loads" ON public.load_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.loads WHERE loads.id = load_applications.load_id AND loads.poster_id = auth.uid())
  );
CREATE POLICY "Drivers can view own applications" ON public.load_applications
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can insert applications" ON public.load_applications
  FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Posters can update applications for their loads" ON public.load_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.loads WHERE loads.id = load_applications.load_id AND loads.poster_id = auth.uid())
  );

-- DRIVER PROFILES
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Driver profiles viewable by load posters" ON public.driver_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.loads WHERE loads.assigned_driver_id = driver_profiles.user_id)
    OR auth.uid() = user_id
  );
CREATE POLICY "Users can insert own driver profile" ON public.driver_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own driver profile" ON public.driver_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- REVIEWS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are publicly readable" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- TRANSACTIONS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );
CREATE POLICY "Conversation participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

-- SEARCH LOG
ALTER TABLE public.search_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert search logs" ON public.search_log
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own search logs" ON public.search_log
  FOR SELECT USING (auth.uid() = user_id);

-- PLATFORM CONFIG
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform config is publicly readable" ON public.platform_config
  FOR SELECT USING (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_loads_updated_at
  BEFORE UPDATE ON public.loads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_driver_profiles_updated_at
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Bakersfield')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Update provider rating when review is inserted
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.service_providers
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
      AND type = 'provider_rating'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
      AND type = 'provider_rating'
    )
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();
