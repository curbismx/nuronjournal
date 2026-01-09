import { Link } from "react-router-dom";
import nuronLogo from "@/assets/nuron_logo.png";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white font-outfit">
      {/* Header */}
      <header className="bg-[#2E2E2E] py-6">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/welcome" className="inline-block">
            <img src={nuronLogo} alt="Nuron" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-8">
          Privacy Policy
        </h1>
        
        <p className="text-[#666666] mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-lg max-w-none text-[#666666]">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Introduction
            </h2>
            <p className="mb-4 leading-relaxed">
              At Nuron, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our mobile application and 
              web service. Please read this privacy policy carefully.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Information We Collect
            </h2>
            
            <h3 className="text-xl font-medium text-[#333333] mb-3 mt-6">
              Account Information
            </h3>
            <p className="mb-4 leading-relaxed">
              When you create an account, we collect your email address for authentication purposes 
              and to provide you with account-related communications.
            </p>

            <h3 className="text-xl font-medium text-[#333333] mb-3 mt-6">
              Note Content
            </h3>
            <p className="mb-4 leading-relaxed">
              We store the notes you create, including text content, images, and audio recordings. 
              This data is stored securely on our servers to enable cloud sync across your devices.
            </p>

            <h3 className="text-xl font-medium text-[#333333] mb-3 mt-6">
              Location and Weather Data
            </h3>
            <p className="mb-4 leading-relaxed">
              With your permission, we may access your device's location to add weather information 
              to your notes. This is entirely optional and can be disabled at any time. Location 
              data is used only to fetch weather information and is not stored or tracked.
            </p>

            <h3 className="text-xl font-medium text-[#333333] mb-3 mt-6">
              Microphone Access
            </h3>
            <p className="mb-4 leading-relaxed">
              Nuron uses microphone access to enable voice recording and transcription features. 
              Audio is processed to convert speech to text and may be temporarily stored for 
              transcription purposes. You control when the microphone is active.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To sync your notes across devices</li>
              <li>To enable voice transcription features</li>
              <li>To provide weather context for your notes</li>
              <li>To publish notes as blog posts when you choose to do so</li>
              <li>To communicate with you about your account</li>
              <li>To improve our services</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Data Storage and Security
            </h2>
            <p className="mb-4 leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use Supabase, 
              a trusted cloud platform, to store and manage your data. All data transmission 
              is encrypted using HTTPS/TLS protocols.
            </p>
            <p className="mb-4 leading-relaxed">
              Notes stored locally on your device before signing up remain on your device until 
              you choose to sync them to the cloud.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Third-Party Services
            </h2>
            <p className="mb-4 leading-relaxed">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>OpenAI:</strong> For AI-powered transcription and text rewriting features</li>
              <li><strong>Open-Meteo:</strong> For weather data</li>
              <li><strong>RevenueCat:</strong> For subscription management (iOS)</li>
            </ul>
            <p className="mt-4 leading-relaxed">
              These services have their own privacy policies and we encourage you to review them.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Your Rights
            </h2>
            <p className="mb-4 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Export your notes</li>
              <li>Opt out of location and weather features</li>
              <li>Control which notes are published publicly</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Published Content
            </h2>
            <p className="mb-4 leading-relaxed">
              When you choose to publish a note, it becomes publicly accessible at your blog URL. 
              You can unpublish notes at any time to make them private again. Published content 
              may be indexed by search engines.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Children's Privacy
            </h2>
            <p className="mb-4 leading-relaxed">
              Nuron is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Changes to This Policy
            </h2>
            <p className="mb-4 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last 
              updated" date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Contact Us
            </h2>
            <p className="mb-4 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@nuron.life" className="text-[#E57373] hover:underline">
                privacy@nuron.life
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2E2E2E] py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            © 2025 Nuron. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
