-- ============================================================
-- MARKETPLACE V2 MIGRATION
-- Adds: profiles, orders tables; extends listings & reviews
-- ============================================================

-- 1. PROFILES (rich identity layer on top of users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (user_type IN ('individual', 'company', 'both')),
  display_name TEXT NOT NULL DEFAULT '',
  company_name TEXT,
  avatar_url TEXT,
  areas_covered TEXT[] DEFAULT '{}',
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend listings with vertical, role_type, status, location
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS vertical TEXT
    CHECK (vertical IN ('market', 'services', 'rentals', 'transportation')),
  ADD COLUMN IF NOT EXISTS role_type TEXT
    CHECK (role_type IN (
      'shopper', 'shop_owner', 'customer', 'service_provider',
      'rentee', 'renter', 'driver', 'load_poster'
    )),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'closed')),
  ADD COLUMN IF NOT EXISTS price_rate TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Backfill vertical from existing type column
UPDATE public.listings SET vertical = 'market'    WHERE type = 'market'   AND vertical IS NULL;
UPDATE public.listings SET vertical = 'services'  WHERE type = 'service'  AND vertical IS NULL;

-- 3. ORDERS (transactional layer)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requesting'
    CHECK (status IN ('requesting', 'in_progress', 'completed', 'cancelled')),
  has_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Link reviews to orders (1 review per completed transaction)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_unique
  ON public.reviews(order_id) WHERE order_id IS NOT NULL;

-- 5. New indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type  ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_orders_buyer        ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller       ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_listing      ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_vertical   ON public.listings(vertical);
CREATE INDEX IF NOT EXISTS idx_listings_role_type  ON public.listings(role_type);
CREATE INDEX IF NOT EXISTS idx_listings_status_col ON public.listings(status);

-- 6. RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Profiles are publicly viewable'
  ) THEN
    CREATE POLICY "Profiles are publicly viewable" ON public.profiles
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 7. RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Participants can view own orders'
  ) THEN
    CREATE POLICY "Participants can view own orders" ON public.orders
      FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Buyers can create orders'
  ) THEN
    CREATE POLICY "Buyers can create orders" ON public.orders
      FOR INSERT WITH CHECK (auth.uid() = buyer_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Participants can update orders'
  ) THEN
    CREATE POLICY "Participants can update orders" ON public.orders
      FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
END $$;

-- 8. Triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_orders_updated_at'
  ) THEN
    CREATE TRIGGER set_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 9. Extend handle_new_user to also create a profile row
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Bakersfield')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, display_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'individual'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update profile average_rating when a review targets a user
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET average_rating = (
    SELECT COALESCE(AVG(rating::DECIMAL), 0)
    FROM public.reviews
    WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_new_review_update_profile'
  ) THEN
    CREATE TRIGGER on_new_review_update_profile
      AFTER INSERT ON public.reviews
      FOR EACH ROW EXECUTE FUNCTION update_profile_rating();
  END IF;
END $$;
