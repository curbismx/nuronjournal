import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/nuron-logo.png';

// Intersection Observer hook for scroll animations
const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
};

// Fade in component
const FadeIn = ({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/[0.05]">
        <div className="max-w-[980px] mx-auto px-6 h-14 flex items-center justify-between">
          <img src={logo} alt="Nuron" className="h-8 w-auto" />
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.location.href = '/?login=true'}
              className="text-black/60 hover:text-black font-outfit text-[12px] transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => window.location.href = '/?signup=true'}
              className="bg-black text-white font-outfit font-medium text-[12px] px-4 py-1.5 rounded-full hover:bg-black/80 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            className="text-black text-[56px] sm:text-[80px] lg:text-[96px] font-outfit font-semibold leading-[1.05] tracking-[-0.03em] mb-4"
            style={{ animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            Your voice.
            <br />
            <span className="bg-gradient-to-r from-[#E56157] via-[#E88BAD] to-[#6BA8D8] bg-clip-text text-transparent">
              Your story.
            </span>
          </h1>
          
          <p 
            className="text-black/50 text-[21px] sm:text-[24px] font-outfit font-normal leading-[1.4] max-w-2xl mx-auto mb-10"
            style={{ animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards', opacity: 0 }}
          >
            Speak your thoughts. Nuron transcribes, organizes, and keeps them forever.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards', opacity: 0 }}
          >
            <button
              onClick={() => navigate('/?signup=true')}
              className="bg-[#E56157] hover:bg-[#d4554c] text-white font-outfit font-medium text-[17px] px-8 py-3.5 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start for free
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[#6BA8D8] hover:text-[#5a97c7] font-outfit text-[17px] transition-colors"
            >
              Learn more →
            </button>
          </div>
        </div>
      </section>

      {/* Voice First Section */}
      <section className="py-32 px-6 border-t border-black/[0.05]">
        <div className="max-w-[980px] mx-auto">
          <FadeIn className="text-center">
            <p className="text-[#E56157] font-outfit text-[12px] font-medium tracking-[0.08em] uppercase mb-4">
              Voice-First
            </p>
            <h2 className="text-black text-[48px] sm:text-[56px] font-outfit font-semibold leading-[1.1] tracking-[-0.02em] mb-6">
              Talk. Don't type.
            </h2>
            <p className="text-black/50 text-[21px] font-outfit leading-[1.5] max-w-2xl mx-auto">
              Capture ideas at the speed of thought. Just tap and speak — 
              Nuron transforms your words into beautifully formatted notes instantly.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto">
          <FadeIn className="text-center mb-20">
            <h2 className="text-black text-[48px] sm:text-[56px] font-outfit font-semibold leading-[1.1] tracking-[-0.02em]">
              Everything you need.
              <br />
              <span className="text-black/30">Nothing you don't.</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'AI Transcription',
                description: 'Whisper-powered voice recognition delivers industry-leading accuracy. Your words, captured perfectly.',
                gradient: 'from-[#E56157] to-[#E88BAD]'
              },
              {
                title: 'Instant Search',
                description: 'Find anything in milliseconds. Full-text search across all your notes, no matter how many.',
                gradient: 'from-[#6BA8D8] to-[#8DBA55]'
              },
              {
                title: 'Smart Organization',
                description: 'Folders that make sense. Organize your thoughts your way, with drag-and-drop simplicity.',
                gradient: 'from-[#E88BAD] to-[#6BA8D8]'
              },
              {
                title: 'Weather & Context',
                description: 'Every note captures the moment — weather, time, location. Your memories, in full context.',
                gradient: 'from-[#8DBA55] to-[#E56157]'
              },
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="group p-8 rounded-3xl bg-white border border-black/[0.04] hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-500">
                  <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${feature.gradient} mb-6 group-hover:w-20 transition-all duration-500`} />
                  <h3 className="text-black text-[24px] font-outfit font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-black/50 text-[17px] font-outfit leading-[1.5]">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* AI Rewrite Section */}
      <section className="py-32 px-6 border-t border-black/[0.05]">
        <div className="max-w-[980px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <p className="text-[#E88BAD] font-outfit text-[12px] font-medium tracking-[0.08em] uppercase mb-4">
                AI-Powered
              </p>
              <h2 className="text-black text-[40px] sm:text-[48px] font-outfit font-semibold leading-[1.1] tracking-[-0.02em] mb-6">
                Write better.
                <br />
                Effortlessly.
              </h2>
              <p className="text-black/50 text-[17px] font-outfit leading-[1.6] mb-8">
                Nuron's AI can polish your thoughts, fix grammar, adjust tone, or completely rewrite your notes. 
                Your ideas, refined with one tap.
              </p>
              <ul className="space-y-4">
                {['Fix grammar & spelling', 'Adjust tone and style', 'Expand or condense', 'Translate to any language'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-black/60 font-outfit text-[15px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E88BAD]" />
                    {item}
                  </li>
                ))}
              </ul>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#E88BAD]/10 to-transparent border border-black/[0.04]">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white border border-black/[0.06]">
                    <p className="text-black/40 font-outfit text-[12px] uppercase tracking-wider mb-2">Original</p>
                    <p className="text-black/60 font-outfit text-[15px] leading-relaxed">
                      had a really good meeting today with the team we talked about alot of stuff for next quarter
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#E88BAD]/20 flex items-center justify-center">
                      <span className="text-[#E88BAD] text-sm">↓</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E88BAD]/10 border border-[#E88BAD]/20">
                    <p className="text-[#E88BAD] font-outfit text-[12px] uppercase tracking-wider mb-2">Refined</p>
                    <p className="text-black font-outfit text-[15px] leading-relaxed">
                      Had a productive team meeting today. We discussed key priorities and strategic initiatives for Q1, including launch timelines and resource allocation.
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Publish Section */}
      <section className="py-32 px-6 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto text-center">
          <FadeIn>
            <p className="text-[#6BA8D8] font-outfit text-[12px] font-medium tracking-[0.08em] uppercase mb-4">
              Share Your Story
            </p>
            <h2 className="text-black text-[48px] sm:text-[56px] font-outfit font-semibold leading-[1.1] tracking-[-0.02em] mb-6">
              From journal to blog.
              <br />
              <span className="text-black/30">In one tap.</span>
            </h2>
            <p className="text-black/50 text-[21px] font-outfit leading-[1.5] max-w-2xl mx-auto mb-12">
              Turn any folder into a beautiful public blog. Share your thoughts with the world, 
              or keep them private with password protection.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.2} className="flex flex-wrap justify-center gap-6">
            {[
              'nuron.life/yourname',
              'Password protection',
              'Selective publishing',
              'Beautiful themes'
            ].map((item, i) => (
              <span 
                key={i}
                className="px-5 py-2.5 rounded-full bg-white border border-black/[0.06] text-black/60 font-outfit text-[14px]"
              >
                {item}
              </span>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* Sync Section */}
      <section className="py-32 px-6 border-t border-black/[0.05]">
        <div className="max-w-[980px] mx-auto text-center">
          <FadeIn>
            <h2 className="text-black text-[48px] sm:text-[56px] font-outfit font-semibold leading-[1.1] tracking-[-0.02em] mb-6">
              Everywhere you are.
            </h2>
            <p className="text-black/50 text-[21px] font-outfit leading-[1.5] max-w-xl mx-auto mb-12">
              iPhone. iPad. Web. Your notes sync instantly across every device.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.1} className="flex justify-center gap-12">
            {['iPhone', 'iPad', 'Web'].map((device, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.04] flex items-center justify-center">
                  <span className="text-2xl">
                    {device === 'iPhone' ? '📱' : device === 'iPad' ? '📱' : '💻'}
                  </span>
                </div>
                <p className="text-black/50 font-outfit text-[14px]">{device}</p>
              </div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 px-6 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto text-center">
          <FadeIn>
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white border border-black/[0.04] flex items-center justify-center">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-black text-[40px] sm:text-[48px] font-outfit font-semibold leading-[1.1] tracking-[-0.02em] mb-6">
              Private by design.
            </h2>
            <p className="text-black/50 text-[17px] font-outfit leading-[1.6] max-w-xl mx-auto">
              Your thoughts are encrypted and secure. We never read, analyze, or sell your personal data. 
              Your journal is yours alone.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#E56157]/5 to-transparent pointer-events-none" />
        <div className="max-w-[980px] mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-black text-[56px] sm:text-[72px] font-outfit font-semibold leading-[1.05] tracking-[-0.03em] mb-6">
              Start remembering.
            </h2>
            <p className="text-black/50 text-[21px] font-outfit mb-10">
              Free forever. No credit card required.
            </p>
            <button
              onClick={() => navigate('/?signup=true')}
              className="bg-black text-white font-outfit font-semibold text-[17px] px-10 py-4 rounded-full hover:bg-black/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free
            </button>
            <p className="mt-8 text-black/40 font-outfit text-[14px]">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/?login=true')}
                className="text-black/60 hover:text-black underline underline-offset-4 transition-colors"
              >
                Sign in
              </button>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-black/[0.05]">
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-black/40 font-outfit text-[12px]">
            © 2026 Nuron. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-black/40 hover:text-black/70 font-outfit text-[12px] transition-colors">Privacy</a>
            <a href="#" className="text-black/40 hover:text-black/70 font-outfit text-[12px] transition-colors">Terms</a>
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
      `}</style>
    </div>
  );
};

export default LandingPage;
