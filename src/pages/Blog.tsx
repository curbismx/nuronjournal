import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface BlogNote {
  id: string;
  title: string;
  content_blocks: Array<{ type: string; id: string; content?: string; url?: string }>;
  created_at: string;
  is_published: boolean;
}

interface BlogData {
  blog_name: string;
  blog_password: string | null;
  folder_id: string;
  username: string;
  notes_sort_order: 'asc' | 'desc';
}

const Blog = () => {
  const { username, blogSlug } = useParams<{ username: string; blogSlug: string }>();
  const navigate = useNavigate();
  
  const [blogData, setBlogData] = useState<BlogData | null>(null);
  const [notes, setNotes] = useState<BlogNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Override global body styles to allow scrolling on blog page
  useEffect(() => {
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalHeight = document.body.style.height;
    const originalWidth = document.body.style.width;
    const htmlOriginalOverflow = document.documentElement.style.overflow;
    const htmlOriginalPosition = document.documentElement.style.position;
    
    // Enable scrolling
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.height = 'auto';
    document.body.style.width = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.position = 'static';
    
    // Restore on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
      document.body.style.width = originalWidth;
      document.documentElement.style.overflow = htmlOriginalOverflow;
      document.documentElement.style.position = htmlOriginalPosition;
    };
  }, []);

  // Fetch blog data
  useEffect(() => {
    const fetchBlog = async () => {
      if (!username || !blogSlug) {
        navigate('/');
        return;
      }

      try {
        // First, find the user by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (profileError || !profileData) {
          setError('Blog not found');
          setLoading(false);
          return;
        }

        // Then find the folder/blog
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('id, blog_name, blog_password, is_blog, blog_slug, notes_sort_order')
          .eq('user_id', profileData.id)
          .eq('blog_slug', blogSlug.toLowerCase())
          .eq('is_blog', true)
          .maybeSingle();

        if (folderError || !folderData) {
          setError('Blog not found');
          setLoading(false);
          return;
        }

        const sortOrder = (folderData.notes_sort_order || 'desc') as 'asc' | 'desc';
        setBlogData({
          blog_name: folderData.blog_name || 'Untitled Blog',
          blog_password: folderData.blog_password,
          folder_id: folderData.id,
          username: profileData.username || username,
          notes_sort_order: sortOrder
        });

        // Check if password protected
        if (folderData.blog_password) {
          setPasswordRequired(true);
          setLoading(false);
        } else {
          // No password, fetch notes directly
          await fetchNotes(folderData.id, sortOrder);
        }
      } catch (err) {
        setError('Something went wrong');
        setLoading(false);
      }
    };

    fetchBlog();
  }, [username, blogSlug, navigate]);

  const fetchNotes = async (folderId: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('id, title, content_blocks, created_at, is_published')
      .eq('folder_id', folderId)
      .eq('is_published', true)
      .order('created_at', { ascending: sortOrder === 'asc' });

    if (notesError) {
      setError('Could not load blog posts');
    } else {
      setNotes((notesData as BlogNote[]) || []);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (blogData && passwordInput === blogData.blog_password) {
      setAuthenticated(true);
      setPasswordRequired(false);
      setLoading(true);
      await fetchNotes(blogData.folder_id, blogData.notes_sort_order);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return { day, month, year, full: `${day} ${month} ${year}` };
  };

  const getFirstImage = (contentBlocks: BlogNote['content_blocks']) => {
    const imageBlock = contentBlocks.find(b => b.type === 'image');
    return imageBlock?.url || null;
  };

  const getTextContent = (contentBlocks: BlogNote['content_blocks']) => {
    return contentBlocks
      .filter(b => b.type === 'text' && b.content)
      .map(b => b.content)
      .join('\n\n');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 font-outfit text-[18px]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-white/60 font-outfit text-[18px]">
            {error}
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-[10px] text-white font-outfit text-[16px] transition-colors"
        >
          Go to Nuron
        </button>
      </div>
    );
  }

  // Password required state
  if (passwordRequired && !authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="bg-[hsl(0,0%,18%)] rounded-[20px] p-8 text-center">
            <h1 className="text-white font-outfit text-[32px] font-medium mb-2">
              {blogData?.blog_name}
            </h1>
            <p className="text-white/40 font-outfit text-[16px] mb-8">
              This blog is password protected
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className={`w-full px-4 py-3 rounded-[10px] bg-white/10 border ${passwordError ? 'border-red-500' : 'border-white/20'} text-white text-[16px] font-outfit placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors`}
                autoFocus
              />
              <button 
                type="submit"
                className="w-full px-4 py-3 rounded-[10px] bg-white text-[hsl(0,0%,18%)] font-outfit font-medium text-[16px] hover:bg-white/90 transition-colors"
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Blog content
  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* Header - 300px dark area */}
      <header 
        className="bg-[hsl(0,0%,18%)] px-6 flex items-end"
        style={{ height: '300px' }}
      >
        <div className="max-w-[800px] w-full mx-auto pb-12">
          <h1 className="text-white font-outfit text-[48px] font-bold leading-tight text-left">
            {blogData?.blog_name}
          </h1>
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-[800px] mx-auto px-6 py-12">
        {notes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[hsl(0,0%,50%)] font-outfit text-[18px]">
              No posts yet
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {notes.map((note) => {
              const { day, month, year } = formatDate(note.created_at);
              const firstImage = getFirstImage(note.content_blocks);
              const textContent = getTextContent(note.content_blocks);

              return (
                <article key={note.id} className="border-b border-[hsl(0,0%,85%)] pb-16 last:border-b-0">
                  {/* Featured Image - 2:3 ratio (height:width), landscape */}
                  {firstImage && (
                    <div 
                      className="mb-8 w-full overflow-hidden rounded-[12px]"
                      style={{ aspectRatio: '3/2' }}
                    >
                      <img
                        src={firstImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-baseline gap-3 mb-4">
                    <span 
                      className="text-[48px] font-bold leading-none text-[hsl(60,1%,66%)]"
                      style={{ fontFamily: 'Roboto Mono, monospace', letterSpacing: '-0.05em' }}
                    >
                      {day}
                    </span>
                    <span className="text-[16px] font-outfit text-[hsl(0,0%,50%)]">
                      {month} {year}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-[28px] font-outfit font-semibold text-[hsl(0,0%,20%)] mb-6 leading-tight">
                    {note.title || 'Untitled'}
                  </h2>

                  {/* Content */}
                  <div className="text-[16px] font-outfit text-[hsl(0,0%,30%)] leading-relaxed whitespace-pre-wrap">
                    {textContent}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[hsl(0,0%,90%)] bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <a 
            href="/"
            className="text-[hsl(0,0%,60%)] font-outfit text-[14px] hover:text-[hsl(0,0%,40%)] transition-colors"
          >
            Powered by Nuron
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
