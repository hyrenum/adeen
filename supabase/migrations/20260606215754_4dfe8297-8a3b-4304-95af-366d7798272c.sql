CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "p_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "p_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "p_delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surah_id INTEGER NOT NULL,
  ayah_id INTEGER,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "b_select" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "b_insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "b_delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surah_id INTEGER NOT NULL,
  ayah_id INTEGER,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "n_select" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "n_insert" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "n_update" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "n_delete" ON public.notes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_surah_id INTEGER NOT NULL DEFAULT 1,
  last_ayah_id INTEGER NOT NULL DEFAULT 1,
  last_juz_id INTEGER,
  last_page_id INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rp_insert" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rp_update" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rp_delete" ON public.reading_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name', NEW.email);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();