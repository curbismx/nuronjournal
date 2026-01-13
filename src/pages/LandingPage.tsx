import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Mic, 
  LayoutGrid, 
  Cloud, 
  Globe, 
  FileText, 
  Sparkles, 
  Image, 
  Paintbrush,
  Menu,
  X,
  Quote
} from "lucide-react";

// Assets
import nuronLogo from "@/assets/nuronlogo.png";
import headerImage from "@/assets/header.png";
import iPhoneImage from "@/assets/iPhone.png";
import blogPublishingImage from "@/assets/blog-publishing.png";
import appStoreBadge from "@/assets/available_on_the_appstore.png";

const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const { ref, isInView } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: isInView ? 1 : 0, transform: isInView ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s` }}>
      {children}
    </div>
  );
};

const features = [
  { icon: Paintbrush, title: "Beautiful Design & UI", description: "A minimalist interface that gets out of your way." },
  { icon: Mic, title: "One Tap Recording", description: "Start capturing your thoughts instantly with a single tap." },
  { icon: LayoutGrid, title: "Notes Your Way", description: "Organize notes in folders, switch between grid and list views." },
  { icon: Cloud, title: "Sync Across Devices", description: "Your notes follow you everywhere seamlessly." },
  { icon: Globe, title: "One Tap Publish", description: "Transform any note into a public blog post with a single tap." },
  { icon: FileText, title: "Simplest Blog Ever", description: "Create a beautiful blog in seconds. No setup required." },
  { icon: Sparkles, title: "AI Rewrite", description: "Let AI help you refine and polish your writing." },
  { icon: Image, title: "Add Images", description: "Add photos directly from your camera or library." }
];

const testimonials = [
  { quote: "Nuron has completely changed how I capture ideas. The voice recording is instant and the transcription is magic.", author: "Sarah M.", role: "Writer", bgColor: "bg-[#E8F0E8]" },
  { quote: "I've tried dozens of note apps. Nuron is the first one that actually stuck. Simple, fast, beautiful.", author: "James K.", role: "Entrepreneur", bgColor: "bg-[#FDF6E3]" },
  { quote: "The publishing feature is genius. I went from private notes to a public blog in literally one tap.", author: "Maria L.", role: "Blogger", bgColor: "bg-[#F5F5F5]" },
  { quote: "As a power user, I appreciate the depth. Folders, sorting, themes - everything I need without the clutter.", author: "David R.", role: "Developer", bgColor: "bg-[#FFE8E5]" }
];

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogin = () => { window.location.href = "/?login=true"; };
  const handleSignup = () => { window.location.href = "/?signup=true"; };
  const scrollToSection = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); };

  return (
    <div className="fixed inset-0 bg-white font-outfit overflow-y-auto overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={nuronLogo} alt="Nuron" className="h-[22px] w-auto" />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("features")} className="text-[#666666] hover:text-[#333333] transition-colors text-base font-medium">Features</button>
            <button onClick={() => scrollToSection("pricing")} className="text-[#666666] hover:text-[#333333] transition-colors text-base font-medium">Pricing</button>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={handleLogin} className="text-[#666666] hover:text-[#333333] transition-colors text-base font-medium px-4 py-2">Log In</button>
            <button onClick={handleSignup} className="text-[#E57373] hover:text-[#EF5350] text-base font-medium transition-colors">Sign Up</button>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-[#333333] p-2" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-4">
            <button onClick={() => scrollToSection("features")} className="block w-full text-left text-[#666666] hover:text-[#333333] py-2">Features</button>
            <button onClick={() => scrollToSection("pricing")} className="block w-full text-left text-[#666666] hover:text-[#333333] py-2">Pricing</button>
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
              <button onClick={handleLogin} className="w-full text-[#666666] py-2 border border-gray-200 rounded-full">Log In</button>
              <button onClick={handleSignup} className="w-full text-[#E57373] py-2 font-medium">Sign Up</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        {/* Animated mist background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="mist-blob-1 absolute top-0 w-[400px] h-[300px] rounded-full bg-gradient-to-r from-sky-400/25 via-blue-300/20 to-transparent blur-3xl" />
          <div className="mist-blob-2 absolute top-1/3 w-[350px] h-[250px] rounded-full bg-gradient-to-l from-blue-400/20 via-cyan-300/15 to-transparent blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <FadeIn><h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-[#6BA8D8] mb-6 tracking-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Remember Everything</h1></FadeIn>
          <FadeIn delay={0.1}><p className="text-xl md:text-2xl text-[#999999] mb-4 max-w-2xl mx-auto" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>One tap voice recording for all those snippets of information</p></FadeIn>
          <FadeIn delay={0.2}><p className="text-base md:text-lg text-[#AAAAAA] max-w-xl mx-auto mb-8" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>Nuron gives you the space to calm your mind and journal every aspect of your life</p></FadeIn>
          <FadeIn delay={0.3}><a href="https://apps.apple.com/app/nuron" target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform"><img src={appStoreBadge} alt="Download on the App Store" className="h-12 md:h-14 drop-shadow-sm" /></a></FadeIn>
          <FadeIn delay={0.4} className="max-w-5xl mx-auto mt-12"><img src={headerImage} alt="Nuron app on multiple devices" className="w-full drop-shadow-2xl" /></FadeIn>
        </div>
      </section>

      {/* Nuron for Everybody */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-8">Nuron for Everybody</h2></FadeIn>
          <FadeIn delay={0.1}><p className="text-lg text-[#666666] leading-relaxed max-w-3xl mx-auto">
            Life moves fast, and your best ideas don't wait for the perfect moment to write them down. Nuron lets you capture thoughts the moment they happen—just tap and speak. Whether you're a busy professional processing your day, a creative mind catching fleeting inspiration, a student organising lectures, or a parent juggling everything at once, Nuron gives you a place to offload your mental chatter.
          </p></FadeIn>
        </div>
        <FadeIn delay={0.2} className="mt-12 md:mt-16 px-6">
          <img src={iPhoneImage} alt="Nuron on iPhone" className="w-full max-w-5xl mx-auto" />
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32 bg-[#F9F9F6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Everything You Need</h2></FadeIn>
            <FadeIn delay={0.1}><p className="text-lg text-[#666666] max-w-2xl mx-auto">Simple tools that work together to help you capture, organize, and share your thoughts.</p></FadeIn>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-[#F5F5F5] rounded-xl flex items-center justify-center mb-4"><f.icon className="w-6 h-6 text-[#666666]" /></div>
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Publish to Web */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Publish to the Web in Seconds</h2></FadeIn>
          <FadeIn delay={0.1}><p className="text-lg text-[#666666] leading-relaxed max-w-3xl mx-auto mb-12">
            Transform any folder into a beautiful blog or a simple one-page event description. No complicated setup, no hosting headaches. Just tap publish and your content is live. Nuron does it all for you — whether you're sharing travel stories, documenting your journey, or creating a quick event page.
          </p></FadeIn>
        </div>
        <FadeIn delay={0.2} className="px-6">
          <img src={blogPublishingImage} alt="Publish your content to the web" className="w-[80%] mx-auto rounded-2xl" />
        </FadeIn>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 bg-[#F9F9F6]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Free to Start</h2></FadeIn>
          <FadeIn delay={0.1}><p className="text-xl text-[#666666] mb-6">No credit card required</p></FadeIn>
          <FadeIn delay={0.2}><p className="text-lg text-[#666666] mb-8">Use Nuron free on the web. Upgrade to Pro for mobile app access, cloud sync, and AI features — just $4.99/month.</p></FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleSignup} className="bg-[#E57373] hover:bg-[#EF5350] text-white px-8 py-3 rounded-full text-lg font-medium transition-all hover:scale-105">Get Started Free</button>
              <a href="https://apps.apple.com/app/nuron" target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform"><img src={appStoreBadge} alt="Download on the App Store" className="h-12" /></a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-16 text-center">What People Are Saying</h2></FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.author} delay={i * 0.1}>
                <div className={`${t.bgColor} rounded-2xl p-6 h-full relative`}>
                  <Quote className="w-8 h-8 text-[#333333]/20 absolute top-4 right-4" />
                  <p className="text-[#333333] mb-6 leading-relaxed">"{t.quote}"</p>
                  <p className="font-semibold text-[#333333]">{t.author}</p>
                  <p className="text-sm text-[#666666]">{t.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-[#F9F9F6]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Start Remembering Everything</h2></FadeIn>
          <FadeIn delay={0.1}><p className="text-xl text-[#666666] mb-8">Download Nuron free today</p></FadeIn>
          <FadeIn delay={0.2}><a href="https://apps.apple.com/app/nuron" target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform"><img src={appStoreBadge} alt="Download on the App Store" className="h-14 md:h-16" /></a></FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <img src={nuronLogo} alt="Nuron" className="h-6 w-auto" />
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[#666666] hover:text-[#333333] transition-colors">Home</button>
            <button onClick={() => scrollToSection("features")} className="text-[#666666] hover:text-[#333333] transition-colors">Features</button>
            <button onClick={() => scrollToSection("pricing")} className="text-[#666666] hover:text-[#333333] transition-colors">Pricing</button>
            <Link to="/privacy" className="text-[#666666] hover:text-[#333333] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-[#666666] hover:text-[#333333] transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[#999999] text-sm">© 2025 Nuron. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
