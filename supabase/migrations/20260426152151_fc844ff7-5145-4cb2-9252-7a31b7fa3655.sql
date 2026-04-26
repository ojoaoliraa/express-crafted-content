-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  plan TEXT NOT NULL DEFAULT 'free',
  credits_remaining INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ONBOARDING RESPONSES
CREATE TABLE public.onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_positioning TEXT,
  target_audience TEXT,
  tone_of_voice TEXT,
  visual_style TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
  ON public.onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON public.onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON public.onboarding_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding"
  ON public.onboarding_responses FOR DELETE
  USING (auth.uid() = user_id);

-- CAROUSELS
CREATE TABLE public.carousels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea TEXT,
  objective TEXT,
  format_chosen TEXT,
  copy_json JSONB,
  images_json JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carousels"
  ON public.carousels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own carousels"
  ON public.carousels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carousels"
  ON public.carousels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own carousels"
  ON public.carousels FOR DELETE
  USING (auth.uid() = user_id);

-- CREDIT TRANSACTIONS
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();