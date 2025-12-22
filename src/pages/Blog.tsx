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
          .select('id, blog_name, blog_password, is_blog, blog_slug')
          .eq('user_id', profileData.id)
          .eq('blog_slug', blogSlug.toLowerCase())
          .eq('is_blog', true)
          .maybeSingle();

        if (folderError || !folderData) {
          setError('Blog not found');
          setLoading(false);
          return;
        }

        setBlogData({
          blog_name: folderData.blog_name || 'Untitled Blog',
          blog_password: folderData.blog_password,
          folder_id: folderData.id,
          username: profileData.username || username
        });

        // Check if password protected
        if (folderData.blog_password) {
          setPasswordRequired(true);
          setLoading(false);
        } else {
          // No password, fetch notes directly
          await fetchNotes(folderData.id);
        }
      } catch (err) {
        setError('Something went wrong');
        setLoading(false);
      }
    };

    fetchBlog();
  }, [username, blogSlug, navigate]);

  const fetchNotes = async (folderId: string) => {
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('id, title, content_blocks, created_at, is_published')
      .eq('folder_id', folderId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

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
      await fetchNotes(blogData.folder_id);
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
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <h1 className="text-white font-outfit text-[32px] font-medium mb-2">
              {blogData?.blog_name}
            </h1>
            <p className="text-white/40 font-outfit text-[16px]">
              This blog is password protected
            </p>
          </div>
          
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
              className="w-full px-4 py-3 rounded-[10px] bg-white text-[#1a1a2e] font-outfit font-medium text-[16px] hover:bg-white/90 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Blog content
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="py-12 px-6">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-white font-outfit text-[48px] font-medium text-center">
            {blogData?.blog_name}
          </h1>
        </div>
      </header>

      {/* Posts */}
      <main className="px-6 pb-24">
        {notes.length === 0 ? (
          <div className="max-w-[800px] mx-auto">
            <div className="text-center py-24">
              <p className="text-white/40 font-outfit text-[18px]">
                No posts yet
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto space-y-16">
            {notes.map((note) => {
              const { day, month, year } = formatDate(note.created_at);
              const firstImage = getFirstImage(note.content_blocks);
              const textContent = getTextContent(note.content_blocks);

              return (
                <article key={note.id} className="border-b border-white/10 pb-16 last:border-b-0">
                  {/* Featured Image */}
                  {firstImage && (
                    <div className="mb-8 rounded-[12px] overflow-hidden">
                      <img 
                        src={firstImage} 
                        alt="" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-white font-['Roboto_Mono'] text-[48px] font-bold leading-none">
                      {day}
                    </span>
                    <span className="text-white/40 font-outfit text-[16px]">
                      {month} {year}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-white font-outfit text-[28px] font-medium mb-4">
                    {note.title || 'Untitled'}
                  </h2>

                  {/* Content */}
                  <div className="text-white/70 font-outfit text-[16px] leading-[1.8] whitespace-pre-wrap">
                    {textContent}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-[800px] mx-auto text-center">
          <a 
            href="https://nuron.life" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/30 font-outfit text-[14px] hover:text-white/50 transition-colors"
          >
            Powered by Nuron
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
