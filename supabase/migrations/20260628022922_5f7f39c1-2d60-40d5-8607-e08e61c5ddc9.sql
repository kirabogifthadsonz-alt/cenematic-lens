
-- Helper: admin check uses existing has_role(uuid, app_role)
-- All public-readable lookup tables get anon SELECT; user-scoped tables get authenticated CRUD scoped to user_id; admin-only tables restricted via has_role.

-- =================== CONTENT ===================
CREATE TABLE IF NOT EXISTS public.movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  poster_url text,
  video_url text,
  video_url_720p text,
  video_url_480p text,
  trailer_url text,
  category text,
  row text,
  vj text,
  vj_name text,
  year integer,
  release_date date,
  price_ugx integer DEFAULT 0,
  is_free boolean DEFAULT false,
  is_coming_soon boolean DEFAULT false,
  is_series boolean DEFAULT false,
  dropbox_account text,
  series_id uuid,
  part integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.movies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO authenticated;
GRANT ALL ON public.movies TO service_role;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movies_read" ON public.movies FOR SELECT USING (true);
CREATE POLICY "movies_admin_write" ON public.movies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  vj text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.series TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.series TO authenticated;
GRANT ALL ON public.series TO service_role;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_read" ON public.series FOR SELECT USING (true);
CREATE POLICY "series_admin_write" ON public.series FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.content_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_rows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_rows TO authenticated;
GRANT ALL ON public.content_rows TO service_role;
ALTER TABLE public.content_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_rows_read" ON public.content_rows FOR SELECT USING (true);
CREATE POLICY "content_rows_admin_write" ON public.content_rows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.vj_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vj_list TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vj_list TO authenticated;
GRANT ALL ON public.vj_list TO service_role;
ALTER TABLE public.vj_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vj_list_read" ON public.vj_list FOR SELECT USING (true);
CREATE POLICY "vj_list_admin_write" ON public.vj_list FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =================== ADS / OVERLAYS ===================
CREATE TABLE IF NOT EXISTS public.marquee_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  font_size text DEFAULT '16px',
  font_family text DEFAULT 'sans-serif',
  font_color text DEFAULT '#ffffff',
  background_color text DEFAULT '#000000',
  speed integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marquee_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marquee_ads TO authenticated;
GRANT ALL ON public.marquee_ads TO service_role;
ALTER TABLE public.marquee_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marquee_read" ON public.marquee_ads FOR SELECT USING (true);
CREATE POLICY "marquee_admin_write" ON public.marquee_ads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.lower_third_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  layers jsonb DEFAULT '[]'::jsonb,
  start_time_seconds integer DEFAULT 0,
  is_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lower_third_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lower_third_ads TO authenticated;
GRANT ALL ON public.lower_third_ads TO service_role;
ALTER TABLE public.lower_third_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lt_read" ON public.lower_third_ads FOR SELECT USING (true);
CREATE POLICY "lt_admin_write" ON public.lower_third_ads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.squeeze_back_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text,
  image_url_bottom text,
  link_url text,
  link_url_bottom text,
  interval_minutes integer DEFAULT 10,
  duration_seconds integer DEFAULT 10,
  width_percent integer DEFAULT 25,
  height_percent integer DEFAULT 25,
  fit_left boolean DEFAULT false,
  fit_bottom boolean DEFAULT true,
  is_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.squeeze_back_ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squeeze_back_ads TO authenticated;
GRANT ALL ON public.squeeze_back_ads TO service_role;
ALTER TABLE public.squeeze_back_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sb_read" ON public.squeeze_back_ads FOR SELECT USING (true);
CREATE POLICY "sb_admin_write" ON public.squeeze_back_ads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.background_music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  file_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.background_music TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.background_music TO authenticated;
GRANT ALL ON public.background_music TO service_role;
ALTER TABLE public.background_music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bm_read" ON public.background_music FOR SELECT USING (true);
CREATE POLICY "bm_admin_write" ON public.background_music FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.logo_intro_settings (
  id integer PRIMARY KEY,
  is_enabled boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.logo_intro_settings(id, is_enabled) VALUES (1, false) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.logo_intro_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logo_intro_settings TO authenticated;
GRANT ALL ON public.logo_intro_settings TO service_role;
ALTER TABLE public.logo_intro_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logo_read" ON public.logo_intro_settings FOR SELECT USING (true);
CREATE POLICY "logo_admin_write" ON public.logo_intro_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =================== ADMIN / DASHBOARD ===================
CREATE TABLE IF NOT EXISTS public.admin_dashboard_settings (
  id integer PRIMARY KEY,
  displayed_income numeric DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.admin_dashboard_settings(id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_dashboard_settings TO authenticated;
GRANT ALL ON public.admin_dashboard_settings TO service_role;
ALTER TABLE public.admin_dashboard_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_admin_all" ON public.admin_dashboard_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.sub_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  enabled_features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_admins TO authenticated;
GRANT ALL ON public.sub_admins TO service_role;
ALTER TABLE public.sub_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa_admin" ON public.sub_admins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.sub_admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  token text UNIQUE,
  enabled_features jsonb DEFAULT '[]'::jsonb,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_admin_invites TO authenticated;
GRANT ALL ON public.sub_admin_invites TO service_role;
ALTER TABLE public.sub_admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sai_admin" ON public.sub_admin_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.dropbox_watch_settings (
  id integer PRIMARY KEY,
  folder_url text,
  default_category text,
  default_row text,
  dropbox_account text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.dropbox_watch_settings(id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dropbox_watch_settings TO authenticated;
GRANT ALL ON public.dropbox_watch_settings TO service_role;
ALTER TABLE public.dropbox_watch_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dws_admin" ON public.dropbox_watch_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.pending_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  thumbnail_url text,
  video_url text,
  category text,
  row text,
  vj text,
  vj_name text,
  year integer,
  price_ugx integer,
  is_free boolean DEFAULT false,
  is_finished boolean DEFAULT false,
  dropbox_account text,
  status text DEFAULT 'pending',
  source_path text,
  last_edited_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_movies TO authenticated;
GRANT ALL ON public.pending_movies TO service_role;
ALTER TABLE public.pending_movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_admin" ON public.pending_movies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =================== USER-SCOPED ===================
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_self" ON public.wallets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_admin" ON public.wallets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid NOT NULL,
  current_time_seconds integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_progress TO authenticated;
GRANT ALL ON public.watch_progress TO service_role;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wp_self" ON public.watch_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid NOT NULL,
  price numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_self" ON public.purchases FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "purchases_admin_read" ON public.purchases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_key text,
  source text,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_self" ON public.subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subs_admin" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  name text,
  price_ugx integer DEFAULT 0,
  duration_minutes integer,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_packages TO authenticated;
GRANT ALL ON public.subscription_packages TO service_role;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_read" ON public.subscription_packages FOR SELECT USING (true);
CREATE POLICY "sp_admin" ON public.subscription_packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.movie_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_title text NOT NULL,
  production_year integer,
  admin_notes text,
  status text DEFAULT 'pending',
  user_notified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movie_requests TO authenticated;
GRANT ALL ON public.movie_requests TO service_role;
ALTER TABLE public.movie_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_self" ON public.movie_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mr_admin" ON public.movie_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  credits_awarded numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr_self" ON public.referral_rewards FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "rr_admin" ON public.referral_rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dt_self" ON public.device_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wallet_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  image_url text,
  link_url text,
  bonus_percent numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_promotions TO authenticated;
GRANT ALL ON public.wallet_promotions TO service_role;
ALTER TABLE public.wallet_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wpr_read" ON public.wallet_promotions FOR SELECT USING (true);
CREATE POLICY "wpr_admin" ON public.wallet_promotions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =================== STORAGE: avatars bucket policies ===================
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
