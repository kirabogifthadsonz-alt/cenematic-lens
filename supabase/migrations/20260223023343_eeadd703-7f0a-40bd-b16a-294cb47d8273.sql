
-- Add series columns + row + vj_narrator + views to titles
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS row TEXT NOT NULL DEFAULT '';
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS vj_narrator TEXT NOT NULL DEFAULT '';
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS is_series BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.titles(id) ON DELETE SET NULL;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS season INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS episode INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN NOT NULL DEFAULT false;

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Cinematic Lens',
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog posts publicly readable
CREATE POLICY "Blog posts are publicly readable" ON public.blog_posts FOR SELECT USING (true);

-- Admins can manage blog posts
CREATE POLICY "Admins can insert blog posts" ON public.blog_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blog posts" ON public.blog_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blog posts" ON public.blog_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for blog posts updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for blog_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;
