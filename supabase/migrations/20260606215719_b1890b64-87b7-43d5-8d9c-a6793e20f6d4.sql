CREATE TABLE IF NOT EXISTS public.quran_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL,
  preset TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_duration INTEGER,
  daily_target INTEGER,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_goals TO authenticated;
GRANT ALL ON public.quran_goals TO service_role;

ALTER TABLE public.quran_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own goals" ON public.quran_goals;
CREATE POLICY "Users can view their own goals" ON public.quran_goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own goals" ON public.quran_goals;
CREATE POLICY "Users can create their own goals" ON public.quran_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own goals" ON public.quran_goals;
CREATE POLICY "Users can update their own goals" ON public.quran_goals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.quran_goals;
CREATE POLICY "Users can delete their own goals" ON public.quran_goals FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.quran_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  minutes_read INTEGER DEFAULT 0,
  seconds_read INTEGER DEFAULT 0,
  verses_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_progress_unique ON public.goal_progress(goal_id, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_progress TO authenticated;
GRANT ALL ON public.goal_progress TO service_role;

ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.goal_progress;
CREATE POLICY "Users can view their own progress" ON public.goal_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own progress" ON public.goal_progress;
CREATE POLICY "Users can create their own progress" ON public.goal_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own progress" ON public.goal_progress;
CREATE POLICY "Users can update their own progress" ON public.goal_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.goal_progress;
CREATE POLICY "Users can delete their own progress" ON public.goal_progress FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_quran_goals_updated_at ON public.quran_goals;
CREATE TRIGGER update_quran_goals_updated_at
BEFORE UPDATE ON public.quran_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();