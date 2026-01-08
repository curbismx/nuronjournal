import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Intersection Observer hook for scroll animations
const useInView = (options = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

// Animated section wrapper
const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
}) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// Feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  delay: number;
}) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.02]"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E56157]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <span className="text-3xl mb-4 block">{icon}</span>
        <h3 className="text-white font-outfit font-semibold text-lg mb-2">{title}</h3>
        <p className="text-white/50 font-outfit text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

// Step component for "How it works"
const Step = ({ 
  number, 
  title, 
  description, 
  delay 
}: { 
  number: string; 
  title: string; 
  description: string; 
  delay: number;
}) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className="text-center"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E56157] to-[#E88BAD] flex items-center justify-center mx-auto mb-6 text-white font-outfit font-bold text-xl shadow-lg shadow-[#E56157]/30">
        {number}
      </div>
      <h3 className="text-white font-outfit font-semibold text-xl mb-3">{title}</h3>
      <p className="text-white/50 font-outfit text-sm max-w-[280px] mx-auto leading-relaxed">{description}</p>
    </div>
  );
};

// Phone mockup component
const PhoneMockup = ({ className = '' }: { className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Phone frame */}
    <div className="relative w-[280px] h-[580px] bg-[#1a1a1a] rounded-[3rem] border-4 border-[#2a2a2a] shadow-2xl shadow-black/50 overflow-hidden">
      {/* Screen */}
      <div className="absolute inset-2 rounded-[2.5rem] bg-[#0a0a0a] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1a1a1a] rounded-b-2xl z-10" />
        
        {/* App content */}
        <div className="h-full pt-10 px-4 pb-4 overflow-hidden">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-white/40 font-outfit text-[10px] tracking-wider uppercase">January 2026</p>
            <p className="text-white font-outfit font-semibold text-lg">Notes</p>
          </div>
          
          {/* Notes list */}
          <div className="space-y-3">
            {[
              { title: 'Meeting notes from today', time: '2:30 PM', preview: 'Discussed the Q1 roadmap and...' },
              { title: 'Gift ideas for Sarah', time: '11:15 AM', preview: 'Books, candles, maybe a...' },
              { title: 'Recipe: Pasta carbonara', time: 'Yesterday', preview: 'Eggs, pecorino, guanciale...' },
              { title: 'Trip planning thoughts', time: 'Yesterday', preview: 'Looking at flights to...' },
            ].map((note, i) => (
              <div 
                key={i} 
                className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-white font-outfit font-medium text-xs">{note.title}</p>
                  <p className="text-white/30 font-outfit text-[10px]">{note.time}</p>
                </div>
                <p className="text-white/40 font-outfit text-[10px]">{note.preview}</p>
              </div>
            ))}
          </div>
          
          {/* Record button */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E56157] to-[#c44a42] flex items-center justify-center shadow-lg shadow-[#E56157]/40">
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Decorative glow */}
    <div className="absolute -inset-10 bg-gradient-to-br from-[#E56157]/20 via-transparent to-[#E88BAD]/20 blur-3xl -z-10 opacity-60" />
  </div>
);

// Browser mockup component
const BrowserMockup = ({ children, url = 'nuron.life' }: { children: React.ReactNode; url?: string }) => (
  <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a] shadow-2xl shadow-black/50">
    {/* Browser header */}
    <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border-b border-white/[0.08]">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/[0.05] text-white/40 text-xs font-outfit">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {url}
        </div>
      </div>
    </div>
    {/* Content */}
    {children}
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for subtle parallax effect on hero
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] overflow-y-auto overflow-x-hidden z-0">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-[#E56157]/20 via-[#E88BAD]/10 to-transparent rounded-full blur-3xl"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#6BA8D8]/10 via-transparent to-transparent rounded-full blur-3xl"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#1a1a1a]/70 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-outfit font-bold text-xl tracking-tight">Nuron</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/?login=true')}
              className="text-white/70 hover:text-white font-outfit text-[15px] transition-colors px-4 py-2"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/?signup=true')}
              className="bg-white text-[#1a1a1a] font-outfit font-medium text-[15px] px-5 py-2.5 rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 pb-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] mb-8"
                style={{ animation: 'fadeInUp 0.8s ease-out' }}
              >
                <span className="text-sm">✨</span>
                <span className="text-white/60 font-outfit text-sm">Voice-first journaling</span>
              </div>
              
              <h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-outfit font-bold text-white mb-6 leading-[1.1]"
                style={{ animation: 'fadeInUp 0.8s ease-out 0.1s both' }}
              >
                Remember
                <br />
                <span className="bg-gradient-to-r from-[#E56157] to-[#E88BAD] bg-clip-text text-transparent">
                  Everything
                </span>
              </h1>
              
              <p 
                className="text-white/60 font-outfit text-lg sm:text-xl max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed"
                style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}
              >
                Speak your thoughts. Nuron listens, transcribes, and organizes them beautifully. Never forget an idea again.
              </p>
              
              <div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                style={{ animation: 'fadeInUp 0.8s ease-out 0.3s both' }}
              >
                <button
                  onClick={() => navigate('/?signup=true')}
                  className="group relative bg-gradient-to-r from-[#E56157] to-[#E88BAD] text-white font-outfit font-medium text-lg px-8 py-4 rounded-full hover:shadow-lg hover:shadow-[#E56157]/30 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                >
                  Get Started Free
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-white/70 hover:text-white font-outfit text-lg px-8 py-4 transition-colors flex items-center justify-center gap-2 group"
                >
                  See how it works 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* Right content - Phone mockup */}
            <div 
              className="flex justify-center lg:justify-end"
              style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}
            >
              <PhoneMockup />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-12 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {['🎤 Voice Recording', '🧠 AI Transcription', '🔒 Private & Secure', '📱 Sync Everywhere'].map((item, i) => (
              <span key={i} className="text-white/40 font-outfit text-sm tracking-wide">
                {item}
              </span>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-20">
            <span className="text-[#E56157] font-outfit text-sm font-medium tracking-wider uppercase mb-4 block">
              How it works
            </span>
            <h2 className="text-4xl sm:text-5xl font-outfit font-bold text-white mb-6">
              Beautifully Simple
            </h2>
            <p className="text-white/50 font-outfit text-lg max-w-2xl mx-auto">
              Three steps to never forgetting anything again
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <Step
              number="1"
              title="Speak"
              description="Tap the record button and talk naturally. No typing required—just speak your mind."
              delay={0}
            />
            <Step
              number="2"
              title="Transcribe"
              description="Powered by Whisper AI, your voice is instantly converted to beautifully formatted text."
              delay={0.15}
            />
            <Step
              number="3"
              title="Remember"
              description="Your thoughts are saved, organized, and searchable forever. Find anything instantly."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-20">
            <span className="text-[#E56157] font-outfit text-sm font-medium tracking-wider uppercase mb-4 block">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-outfit font-bold text-white mb-6">
              Everything you need
            </h2>
            <p className="text-white/50 font-outfit text-lg max-w-2xl mx-auto">
              Powerful features wrapped in a beautiful, simple interface
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon="🎤" title="Voice Recording" description="Talk, don't type. Capture thoughts at the speed of speech." delay={0} />
            <FeatureCard icon="🧠" title="AI Transcription" description="Powered by Whisper AI for accurate, instant transcription." delay={0.05} />
            <FeatureCard icon="📁" title="Smart Folders" description="Organize your thoughts into collections that make sense to you." delay={0.1} />
            <FeatureCard icon="🔍" title="Search Everything" description="Find any memory instantly with powerful full-text search." delay={0.15} />
            <FeatureCard icon="🌤️" title="Weather Context" description="Each note remembers the weather, adding context to your memories." delay={0.2} />
            <FeatureCard icon="📱" title="Everywhere" description="Seamless sync across all your devices, always up to date." delay={0.25} />
            <FeatureCard icon="🎨" title="Beautiful Themes" description="Four stunning color themes to match your personal style." delay={0.3} />
            <FeatureCard icon="✏️" title="AI Rewrite" description="Let AI help polish and improve your writing with one tap." delay={0.35} />
          </div>
        </div>
      </section>

      {/* Device Showcase */}
      <section className="py-24 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <span className="text-[#E56157] font-outfit text-sm font-medium tracking-wider uppercase mb-4 block">
              Cross-platform
            </span>
            <h2 className="text-4xl sm:text-5xl font-outfit font-bold text-white mb-6">
              Beautiful on every device
            </h2>
            <p className="text-white/50 font-outfit text-lg">
              A native experience on iPhone, iPad, and the web
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="relative">
            <div className="max-w-5xl mx-auto">
              <BrowserMockup url="nuron.life">
                <div className="flex h-[400px]">
                  {/* Sidebar */}
                  <div className="w-48 bg-[#141414] border-r border-white/[0.08] p-4 hidden sm:block">
                    <p className="text-white/40 font-outfit text-xs uppercase tracking-wider mb-4">Folders</p>
                    {['Notes', 'Work', 'Personal', 'Ideas', 'Travel'].map((folder, i) => (
                      <div 
                        key={i} 
                        className={`px-3 py-2 rounded-lg font-outfit text-sm mb-1 ${i === 0 ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/70'}`}
                      >
                        📁 {folder}
                      </div>
                    ))}
                  </div>
                  {/* Notes list */}
                  <div className="w-64 border-r border-white/[0.08] p-4 hidden md:block">
                    <p className="text-white/40 font-outfit text-xs uppercase tracking-wider mb-4">Notes</p>
                    {[
                      { title: 'Meeting notes', time: '2:30 PM' },
                      { title: 'Project ideas', time: '11:00 AM' },
                      { title: 'Book recommendations', time: 'Yesterday' },
                    ].map((note, i) => (
                      <div 
                        key={i} 
                        className={`px-3 py-3 rounded-lg mb-2 ${i === 0 ? 'bg-white/[0.08]' : ''}`}
                      >
                        <p className="text-white font-outfit text-sm font-medium">{note.title}</p>
                        <p className="text-white/40 font-outfit text-xs">{note.time}</p>
                      </div>
                    ))}
                  </div>
                  {/* Note content */}
                  <div className="flex-1 p-6">
                    <p className="text-white/40 font-outfit text-xs mb-2">January 8, 2026</p>
                    <h3 className="text-white font-outfit font-semibold text-xl mb-4">Meeting notes</h3>
                    <div className="text-white/60 font-outfit text-sm leading-relaxed space-y-3">
                      <p>Discussed Q1 priorities with the team:</p>
                      <p>• Launch new onboarding by end of month</p>
                      <p>• Focus on mobile performance</p>
                      <p>• Begin planning collaboration features</p>
                    </div>
                  </div>
                </div>
              </BrowserMockup>
            </div>

            {/* Floating phone */}
            <div className="absolute -right-10 -bottom-10 hidden xl:block">
              <div className="relative w-[200px] h-[420px] bg-[#1a1a1a] rounded-[2rem] border-4 border-[#2a2a2a] shadow-2xl shadow-black/50 overflow-hidden">
                <div className="absolute inset-1.5 rounded-[1.5rem] bg-[#0a0a0a] overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-b-xl z-10" />
                  <div className="p-4 pt-8">
                    <p className="text-white/40 font-outfit text-[8px] text-center uppercase tracking-wider">January 2026</p>
                    <p className="text-white font-outfit font-semibold text-sm text-center mb-4">Notes</p>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                          <div className="h-2 bg-white/20 rounded w-3/4 mb-1" />
                          <div className="h-1.5 bg-white/10 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-10 bg-gradient-to-br from-[#E56157]/20 via-transparent to-[#E88BAD]/20 blur-3xl -z-10 opacity-60" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Blog Publishing Section */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E56157]/10 text-[#E56157] font-outfit text-sm font-medium mb-6">
                ✨ Power Feature
              </span>
              <h2 className="text-4xl sm:text-5xl font-outfit font-bold text-white mb-6 leading-tight">
                More than a journal.
                <br />
                <span className="text-white/50">A publishing platform.</span>
              </h2>
              <p className="text-white/50 font-outfit text-lg mb-8 leading-relaxed">
                Turn any folder into a beautiful blog with one toggle. Share your thoughts with the world, or keep them private with password protection.
              </p>
              <ul className="space-y-4">
                {[
                  'Turn any folder into a beautiful blog instantly',
                  'Custom web addresses at nuron.life/yourname',
                  'Password protect private collections',
                  'Publish individual notes or entire folders'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70 font-outfit">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E56157]/20 flex items-center justify-center text-[#E56157] text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2} className="relative">
              <BrowserMockup url="nuron.life/sarah/travel-journal">
                <div className="p-8 min-h-[350px] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
                  <div className="text-center mb-8">
                    <h3 className="text-white font-outfit font-bold text-2xl mb-2">My Travel Journal</h3>
                    <p className="text-white/40 font-outfit text-sm">Adventures around the world</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: 'Sunrise in Santorini', date: 'Jan 5, 2026' },
                      { title: 'Getting lost in Tokyo', date: 'Dec 28, 2025' },
                      { title: 'A week in Paris', date: 'Dec 15, 2025' },
                    ].map((post, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors">
                        <p className="text-white font-outfit font-medium mb-1">{post.title}</p>
                        <p className="text-white/40 font-outfit text-sm">{post.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </BrowserMockup>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E56157]/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#E88BAD]/20 rounded-full blur-3xl" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection className="text-center p-12 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
            <span className="text-5xl mb-6 block">🔒</span>
            <h2 className="text-3xl sm:text-4xl font-outfit font-bold text-white mb-4">
              Your thoughts are safe with us
            </h2>
            <p className="text-white/50 font-outfit text-lg max-w-xl mx-auto">
              End-to-end security. Your notes are encrypted and stored securely. We never read, sell, or share your personal data.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E56157]/10 via-[#E88BAD]/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-outfit font-bold text-white mb-6 leading-tight">
              Start remembering
              <br />
              everything today
            </h2>
            <p className="text-white/50 font-outfit text-lg mb-10">
              Free to use. No credit card required. Set up in seconds.
            </p>
            <button
              onClick={() => navigate('/?signup=true')}
              className="group relative bg-white text-[#1a1a1a] font-outfit font-semibold text-lg px-10 py-5 rounded-full hover:shadow-xl hover:shadow-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Get Started — It's Free
            </button>
            <p className="mt-8 text-white/40 font-outfit text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/?login=true')}
                className="text-white/60 hover:text-white underline underline-offset-4 transition-colors"
              >
                Log in
              </button>
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-white font-outfit font-bold text-lg">Nuron</p>
            <div className="flex items-center gap-8">
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/40 hover:text-white font-outfit text-sm transition-colors">Features</button>
              <a href="#" className="text-white/40 hover:text-white font-outfit text-sm transition-colors">Privacy</a>
              <a href="#" className="text-white/40 hover:text-white font-outfit text-sm transition-colors">Terms</a>
            </div>
            <p className="text-white/30 font-outfit text-sm">
              Made with ❤️ for thinkers everywhere
            </p>
          </div>
        </div>
      </footer>

      {/* Global animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
