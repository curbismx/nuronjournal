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
const AnimatedSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5 cursor-default"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
        transitionProperty: 'opacity, transform'
      }}
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-white text-xl font-outfit font-medium mb-2">{title}</h3>
      <p className="text-white/60 font-outfit text-[15px] leading-relaxed">{description}</p>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

// Step component for "How it works"
const Step = ({ number, title, description, delay }: { number: string; title: string; description: string; delay: number }) => {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className="text-center"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
        transition: 'all 0.8s ease-out',
        transitionDelay: `${delay}ms`
      }}
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E56157] to-[#E88BAD] flex items-center justify-center text-white text-2xl font-outfit font-bold shadow-lg shadow-[#E56157]/30">
        {number}
      </div>
      <h3 className="text-white text-2xl font-outfit font-medium mb-3">{title}</h3>
      <p className="text-white/60 font-outfit text-[16px] max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
  );
};

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
    <div className="min-h-screen bg-[#1a1a1a] overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #E56157 0%, transparent 50%), radial-gradient(circle at 70% 70%, #6BA8D8 0%, transparent 50%), radial-gradient(circle at 50% 50%, #8DBA55 0%, transparent 50%)',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-[#1a1a1a]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-white text-2xl font-outfit font-semibold tracking-tight">
            Nuron
          </div>
          <div className="flex items-center gap-4">
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          <div 
            className="inline-block mb-6 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full"
            style={{
              animation: 'fadeInUp 0.8s ease-out forwards',
              opacity: 0
            }}
          >
            <span className="text-white/60 font-outfit text-sm">✨ Your voice, your memories, forever</span>
          </div>
          
          <h1 
            className="text-white text-5xl md:text-7xl lg:text-8xl font-outfit font-bold mb-6 leading-[1.1]"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.1s forwards',
              opacity: 0
            }}
          >
            Remember
            <span className="block bg-gradient-to-r from-[#E56157] via-[#E88BAD] to-[#6BA8D8] bg-clip-text text-transparent">
              Everything
            </span>
          </h1>
          
          <p 
            className="text-white/60 text-xl md:text-2xl font-outfit font-light mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
              opacity: 0
            }}
          >
            Speak your thoughts. Nuron listens, transcribes, and organizes them beautifully. Never forget an idea again.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
              opacity: 0
            }}
          >
            <button
              onClick={() => navigate('/?signup=true')}
              className="group relative bg-gradient-to-r from-[#E56157] to-[#E88BAD] text-white font-outfit font-medium text-lg px-8 py-4 rounded-full hover:shadow-lg hover:shadow-[#E56157]/30 transition-all hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">Start Free Today</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#E88BAD] to-[#E56157] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-white/70 hover:text-white font-outfit text-lg px-8 py-4 transition-colors flex items-center gap-2 group"
            >
              See how it works 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          style={{
            animation: 'bounce 2s ease-in-out infinite'
          }}
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/40 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-4">
              Beautifully Simple
            </h2>
            <p className="text-white/60 text-xl font-outfit max-w-xl mx-auto">
              Three steps to never forgetting anything again
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <Step 
              number="1" 
              title="Speak" 
              description="Tap the record button and talk naturally. No typing, no friction, just your thoughts flowing freely."
              delay={0}
            />
            <Step 
              number="2" 
              title="Transcribe" 
              description="Powered by advanced AI, your voice is instantly converted to text with remarkable accuracy."
              delay={200}
            />
            <Step 
              number="3" 
              title="Remember" 
              description="Your thoughts are saved, searchable, and organized. Access them anytime, anywhere, forever."
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <h2 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-4">
              Everything you need
            </h2>
            <p className="text-white/60 text-xl font-outfit max-w-xl mx-auto">
              Powerful features wrapped in a beautiful, simple interface
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon="🎤" 
              title="Voice Recording" 
              description="Talk, don't type. Capture thoughts at the speed of speech with one tap."
              delay={0}
            />
            <FeatureCard 
              icon="🧠" 
              title="AI Transcription" 
              description="Powered by Whisper AI for accurate, instant voice-to-text conversion."
              delay={100}
            />
            <FeatureCard 
              icon="📁" 
              title="Smart Folders" 
              description="Organize your thoughts into collections that make sense to you."
              delay={200}
            />
            <FeatureCard 
              icon="🔍" 
              title="Search Everything" 
              description="Find any memory instantly with powerful full-text search."
              delay={300}
            />
            <FeatureCard 
              icon="🌤️" 
              title="Weather Context" 
              description="Each note captures the weather, adding context to your memories."
              delay={400}
            />
            <FeatureCard 
              icon="📱" 
              title="Sync Everywhere" 
              description="Seamlessly access your notes across all your devices."
              delay={500}
            />
            <FeatureCard 
              icon="🎨" 
              title="Beautiful Themes" 
              description="Four stunning color themes to match your personal style."
              delay={600}
            />
            <FeatureCard 
              icon="✨" 
              title="AI Rewrite" 
              description="Let AI help polish, improve, and refine your writing."
              delay={700}
            />
          </div>
        </div>
      </section>

      {/* Power User Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="inline-block mb-4 px-3 py-1 bg-[#8DBA55]/20 border border-[#8DBA55]/30 rounded-full">
                <span className="text-[#8DBA55] font-outfit text-sm font-medium">Power Feature</span>
              </div>
              <h2 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-6 leading-tight">
                More than a journal.
                <span className="block text-white/60">A publishing platform.</span>
              </h2>
              <p className="text-white/60 text-lg font-outfit mb-8 leading-relaxed">
                Turn any folder into a beautiful blog with one toggle. Share your thoughts with the world, or keep them private with password protection.
              </p>
              <ul className="space-y-4">
                {[
                  'Turn any folder into a beautiful blog instantly',
                  'Custom web addresses at nuron.life/yourname',
                  'Password protect private collections',
                  'Publish individual notes or entire folders'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80 font-outfit">
                    <span className="w-5 h-5 rounded-full bg-[#8DBA55]/20 flex items-center justify-center text-[#8DBA55] text-sm">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                {/* Browser mockup */}
                <div className="bg-[#2E2E2E] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                  {/* Browser header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#E56157]" />
                      <div className="w-3 h-3 rounded-full bg-[#8DBA55]" />
                      <div className="w-3 h-3 rounded-full bg-[#6BA8D8]" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-white/5 rounded-md px-3 py-1 text-white/40 text-sm font-mono">
                        nuron.life/yourname/blog
                      </div>
                    </div>
                  </div>
                  {/* Blog preview */}
                  <div className="p-8 bg-gradient-to-b from-[#2E2E2E] to-[#252525]">
                    <h3 className="text-white text-2xl font-outfit font-bold mb-2">My Travel Journal</h3>
                    <p className="text-white/40 text-sm font-outfit mb-6">Adventures around the world</p>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/5">
                          <div className="h-3 bg-white/20 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-white/10 rounded w-full mb-1" />
                          <div className="h-2 bg-white/10 rounded w-5/6" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#8DBA55]/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#6BA8D8]/20 rounded-full blur-2xl" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonial/Trust Section */}
      <section className="relative py-24 px-6">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <div className="text-5xl mb-6">🔒</div>
            <h3 className="text-white text-2xl md:text-3xl font-outfit font-medium mb-4">
              Your thoughts are safe with us
            </h3>
            <p className="text-white/60 text-lg font-outfit max-w-xl mx-auto">
              End-to-end security. Your notes are encrypted and stored securely. We never read, sell, or share your personal data.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-white text-4xl md:text-6xl font-outfit font-bold mb-6 leading-tight">
              Start remembering
              <span className="block">everything today</span>
            </h2>
            <p className="text-white/60 text-xl font-outfit mb-10">
              Free to use. No credit card required. Set up in seconds.
            </p>
            <button
              onClick={() => navigate('/?signup=true')}
              className="group relative bg-white text-[#1a1a1a] font-outfit font-semibold text-lg px-10 py-5 rounded-full hover:shadow-xl hover:shadow-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Get Started — It's Free
            </button>
            <p className="mt-6 text-white/40 font-outfit">
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
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white text-xl font-outfit font-semibold">Nuron</div>
          <div className="flex items-center gap-8">
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/40 hover:text-white font-outfit text-sm transition-colors">Features</button>
            <a href="#" className="text-white/40 hover:text-white font-outfit text-sm transition-colors">Privacy</a>
            <a href="#" className="text-white/40 hover:text-white font-outfit text-sm transition-colors">Terms</a>
          </div>
          <p className="text-white/30 font-outfit text-sm">
            Made with ❤️ for thinkers everywhere
          </p>
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
        
        @keyframes bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(10px);
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
