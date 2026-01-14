import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Mic, 
  LayoutGrid, 
  Clock, 
  Globe, 
  FolderOpen, 
  Sparkles, 
  Image, 
  Paintbrush,
  Menu,
  X,
  Search
} from "lucide-react";

// Assets
import nuronLogo from "@/assets/nuronlogo.png";
import headerImage from "@/assets/header.png";
import iPhoneImage from "@/assets/iPhone.png";
import blogPublishingImage from "@/assets/blog-publishing.png";
import mobileHeroImage from "@/assets/mobile-hero.png";
import mobileEverybodyImage from "@/assets/mobile-everybody.png";
import mobilePublishImage from "@/assets/mobile-publish.png";

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
  { icon: Mic, title: "One Tap Recording", description: "Hit record and speak. That's it. Your thoughts start capturing instantly." },
  { icon: Sparkles, title: "AI Cleanup", description: "Rambling voice note? Nuron turns it into clear, readable text automatically." },
  { icon: Clock, title: "Your Timeline", description: "Every thought, organised by date. Scroll back through weeks, months, years of your own thinking." },
  { icon: FolderOpen, title: "Folders", description: "Organise however you like. Work ideas, personal reflections, random thoughts—keep them separate or don't." },
  { icon: Search, title: "Search Everything", description: "That idea you had three months ago? Find it in seconds." },
  { icon: Image, title: "Add Images", description: "Attach photos from your camera or library to any entry." },
  { icon: Paintbrush, title: "Beautiful Themes", description: "Make it yours with calming colour themes." },
  { icon: Globe, title: "Publish as Blog", description: "Turn any folder into a simple public page. Share your thoughts with a link." }
];

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileLoginMessage, setShowMobileLoginMessage] = useState(false);
  const handleLogin = () => { window.location.href = "/?login=true"; };
  const handleSignup = () => { window.location.href = "/?signup=true"; };
  const handleMobileLogin = () => { setShowMobileLoginMessage(true); setMobileMenuOpen(false); };
  const scrollToSection = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); };

  return (
    <div className="fixed inset-0 bg-white font-outfit overflow-y-auto overflow-x-hidden">
      {/* Mobile Login Message Modal */}
      {showMobileLoginMessage && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">Not Available on Mobile</h2>
            <p className="text-[#666666] mb-6">Please download Nuron on the App Store</p>
            <a 
              href="https://apps.apple.com/app/nuron" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-[#E57373] hover:bg-[#EF5350] text-white py-3 rounded-full font-medium mb-4 transition-colors"
            >
              Download on App Store
            </a>
            <p className="text-[#999999] text-sm mb-4">To use Nuron on computer, please visit using a computer or tablet</p>
            <button 
              onClick={() => setShowMobileLoginMessage(false)}
              className="text-[#666666] hover:text-[#333333] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
              <button onClick={handleMobileLogin} className="w-full text-[#666666] py-2 border border-gray-200 rounded-full">Log In</button>
              <button onClick={handleMobileLogin} className="w-full text-[#E57373] py-2 font-medium">Sign Up</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <FadeIn><h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-[#6BA8D8] mb-6 tracking-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Your Journal. Just Speak.</h1></FadeIn>
          <FadeIn delay={0.1}><p className="text-xl md:text-2xl text-[#999999] mb-4 max-w-2xl mx-auto" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>The easy way to remember your life.</p></FadeIn>
          <FadeIn delay={0.2}><p className="text-base md:text-lg text-[#AAAAAA] max-w-xl mx-auto mb-8" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.06)' }}>Nuron turns your voice into a beautiful journal. Just tap, talk, and watch your thoughts become clean, readable entries—organised in a timeline you'll actually want to look back on.</p></FadeIn>
          <FadeIn delay={0.3}>
            <button onClick={handleSignup} className="bg-[#E57373] hover:bg-[#EF5350] text-white px-8 py-3 rounded-full text-lg font-medium transition-all hover:scale-105">Get Started Free</button>
            <p className="text-sm text-[#999999] mt-3">Free on web. $4.99/month for iOS sync.</p>
          </FadeIn>
          <FadeIn delay={0.4} className="max-w-5xl mx-auto mt-12">
            <img src={headerImage} alt="Nuron app on multiple devices" className="hidden md:block w-full drop-shadow-2xl" />
            <img src={mobileHeroImage} alt="Nuron app on iPhone" className="md:hidden w-[70%] mx-auto drop-shadow-2xl" />
          </FadeIn>
        </div>
      </section>

      {/* Why Voice? */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-8">You think faster than you type.</h2></FadeIn>
          <FadeIn delay={0.1}>
            <div className="text-lg text-[#666666] leading-relaxed max-w-3xl mx-auto space-y-6">
              <p>Ideas come at the worst times—in the shower, on a walk, halfway through something else. By the time you open a notes app and start typing, the thought is half-gone.</p>
              <p>Nuron lets you capture thoughts the moment they arrive. Speak naturally, even ramble—the AI cleans it up into something you'll actually want to read later.</p>
              <p>No typing. No formatting. No friction. Just your life, in your own voice.</p>
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.2} className="mt-12 md:mt-16 px-6">
          <img src={iPhoneImage} alt="Nuron on iPhone" className="hidden md:block w-full max-w-5xl mx-auto" />
          <img src={mobileEverybodyImage} alt="Nuron app screens" className="md:hidden w-full max-w-sm mx-auto" />
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32 bg-[#F9F9F6]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333]">Simple tools that stay out of your way.</h2></FadeIn>
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

      {/* Share When You're Ready */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Share when you're ready.</h2></FadeIn>
          <FadeIn delay={0.1}>
            <div className="text-lg text-[#666666] leading-relaxed max-w-3xl mx-auto mb-12 space-y-6">
              <p>Some thoughts are just for you. Others deserve an audience.</p>
              <p>Turn any folder into a simple, beautiful blog with one tap. No setup, no hosting, no tech skills. Just your words, live on the web.</p>
              <p>Keep it private. Make it public. It's your journal.</p>
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.2} className="px-6">
          <img src={blogPublishingImage} alt="Publish your content to the web" className="hidden md:block w-[80%] mx-auto rounded-2xl" />
          <img src={mobilePublishImage} alt="Publish your content to the web" className="md:hidden w-full max-w-sm mx-auto rounded-2xl" />
        </FadeIn>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 bg-[#F9F9F6]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Free to start. Affordable to keep.</h2></FadeIn>
          <FadeIn delay={0.1}><p className="text-lg text-[#666666] mb-8">Use Nuron on the web completely free. When you're ready to take it everywhere, the iOS app syncs all your entries for just $4.99/month.</p></FadeIn>
          <FadeIn delay={0.2}>
            <button onClick={handleSignup} className="bg-[#E57373] hover:bg-[#EF5350] text-white px-8 py-3 rounded-full text-lg font-medium transition-all hover:scale-105">Get Started Free</button>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn><h2 className="text-3xl md:text-5xl font-semibold text-[#333333] mb-4">Your thoughts are worth keeping.</h2></FadeIn>
          <FadeIn delay={0.1}><p className="text-xl text-[#666666] mb-8">Start your voice journal today.</p></FadeIn>
          <FadeIn delay={0.2}>
            <button onClick={handleSignup} className="bg-[#E57373] hover:bg-[#EF5350] text-white px-8 py-3 rounded-full text-lg font-medium transition-all hover:scale-105">Get Started Free</button>
          </FadeIn>
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
