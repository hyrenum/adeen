-- Create quran_goals table for tracking user reading goals
CREATE TABLE public.quran_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL, -- 'time_based', 'juz_based', 'khatm'
  preset TEXT, -- 'ten_minutes', 'thirty_days', 'one_year', 'custom'
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'duration'
  target_duration INTEGER, -- duration in days for 'duration' frequency
  daily_target INTEGER, -- minutes per day or verses per day
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal_progress table for daily progress tracking
CREATE TABLE public.goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.quran_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  minutes_read INTEGER DEFAULT 0,
  verses_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on goal_progress for one entry per goal per day
CREATE UNIQUE INDEX idx_goal_progress_unique ON public.goal_progress(goal_id, date);

-- Enable Row Level Security
ALTER TABLE public.quran_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for quran_goals
CREATE POLICY "Users can view their own goals" 
ON public.quran_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.quran_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.quran_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.quran_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for goal_progress
CREATE POLICY "Users can view their own progress" 
ON public.goal_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.goal_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.goal_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_quran_goals_updated_at
BEFORE UPDATE ON public.quran_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();