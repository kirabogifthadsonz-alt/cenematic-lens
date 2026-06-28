
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

ALTER TABLE public.subscription_packages
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS duration_hours numeric;

ALTER TABLE public.wallet_promotions
  ADD COLUMN IF NOT EXISTS min_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS multiplier numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.content_rows
  ADD COLUMN IF NOT EXISTS default_price integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_series_row boolean DEFAULT false;

ALTER TABLE public.pending_movies
  ADD COLUMN IF NOT EXISTS movie_title text,
  ADD COLUMN IF NOT EXISTS production_year integer,
  ADD COLUMN IF NOT EXISTS poster_url text,
  ADD COLUMN IF NOT EXISTS dropbox_file_id text,
  ADD COLUMN IF NOT EXISTS video_url_720p text,
  ADD COLUMN IF NOT EXISTS video_url_480p text;

CREATE OR REPLACE FUNCTION public.apply_referral_code(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_user uuid;
  current_user_id uuid := auth.uid();
  current_referred uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT user_id INTO ref_user FROM public.profiles WHERE referral_code = code;
  IF ref_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid referral code');
  END IF;
  IF ref_user = current_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You cannot refer yourself');
  END IF;

  SELECT referred_by INTO current_referred FROM public.profiles WHERE user_id = current_user_id;
  IF current_referred IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Referral already applied');
  END IF;

  UPDATE public.profiles SET referred_by = ref_user WHERE user_id = current_user_id;
  UPDATE public.profiles SET referral_count = referral_count + 1 WHERE user_id = ref_user;
  INSERT INTO public.referral_rewards (referrer_id, referred_id, credits_awarded)
    VALUES (ref_user, current_user_id, 1);

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;
