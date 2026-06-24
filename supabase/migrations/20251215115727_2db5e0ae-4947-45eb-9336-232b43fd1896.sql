-- Add DELETE policy for reading_progress table (GDPR compliance)
CREATE POLICY "Users can delete their own reading progress"
  ON public.reading_progress
  FOR DELETE
  USING (auth.uid() = user_id);