-- Posters storage bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public) VALUES ('posters', 'posters', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Posters are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posters');

CREATE POLICY "Admins can upload posters"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update posters"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete posters"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'posters' AND has_role(auth.uid(), 'admin'::app_role));

-- Track where pending imports came from
ALTER TABLE public.pending_imports
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'dropbox',
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS pending_imports_source_id_unique
  ON public.pending_imports (source, source_id)
  WHERE source_id IS NOT NULL;