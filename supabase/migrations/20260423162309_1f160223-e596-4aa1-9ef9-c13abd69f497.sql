-- Table to store Dropbox folders the admin wants to watch
CREATE TABLE public.dropbox_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_path TEXT NOT NULL UNIQUE,
  folder_name TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  last_cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dropbox_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage dropbox folders" ON public.dropbox_folders
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dropbox_folders_updated_at
  BEFORE UPDATE ON public.dropbox_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for pending imports awaiting admin approval
CREATE TABLE public.pending_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropbox_file_id TEXT NOT NULL UNIQUE,
  dropbox_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  parsed_title TEXT NOT NULL DEFAULT '',
  parsed_vj TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL DEFAULT 2025,
  duration TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT '',
  category TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'English',
  rating TEXT NOT NULL DEFAULT 'PG',
  tmdb_id INTEGER,
  tmdb_matched BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pending imports" ON public.pending_imports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pending_imports_updated_at
  BEFORE UPDATE ON public.pending_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pending_imports_status ON public.pending_imports(status);
CREATE INDEX idx_pending_imports_created ON public.pending_imports(created_at DESC);

-- Enable realtime so admin sees new pending imports instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_imports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dropbox_folders;