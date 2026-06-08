-- Add DELETE policy to goal_progress table
-- This allows users to delete their own goal progress records
CREATE POLICY "Users can delete their own progress"
ON public.goal_progress
FOR DELETE
USING (auth.uid() = user_id);