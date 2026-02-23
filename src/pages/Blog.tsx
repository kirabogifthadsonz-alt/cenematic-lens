import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  published: boolean;
  created_at: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPosts((data as BlogPost[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="bg-background min-h-screen pt-24 pb-20 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setSelected(null)} className="text-primary text-sm mb-4 hover:underline">← Back to Blog</button>
          {selected.cover_image && <img src={selected.cover_image} alt={selected.title} className="w-full h-64 object-cover rounded-lg mb-6" />}
          <h1 className="text-display text-4xl mb-2">{selected.title}</h1>
          <p className="text-xs text-muted-foreground mb-6">{selected.author} · {new Date(selected.created_at).toLocaleDateString()}</p>
          <div className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-display text-4xl mb-8">Blog</h1>
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No blog posts yet. Check back soon!</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <button
                key={post.id}
                onClick={() => setSelected(post)}
                className="bg-card border border-border rounded-lg overflow-hidden text-left hover:border-primary/50 transition group"
              >
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <span className="text-display text-2xl text-muted-foreground">Blog</span>
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-display text-lg text-foreground group-hover:text-primary transition">{post.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{post.author} · {new Date(post.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{post.excerpt}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
