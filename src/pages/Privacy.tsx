import { Link } from "react-router-dom";
import nuronLogo from "@/assets/nuronlogo.png";

const Privacy = () => {
  return (
    <div className="fixed inset-0 bg-white font-outfit overflow-y-auto">
      {/* Header */}
      <header className="border-b border-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <Link to="/welcome">
            <img src={nuronLogo} alt="Nuron" className="h-8 w-auto" />
          </Link>
          <Link to="/welcome" className="text-[#999999] hover:text-[#666666] transition-colors text-sm">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-semibold text-[#333333] mb-4">
          Privacy Policy
        </h1>
        
        <p className="text-[#999999] mb-12">
          Last updated: January 2025
        </p>

        <p className="text-[#666666] leading-relaxed mb-12">
          At Nuron, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service.
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Information We Collect
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#333333] mb-2">Account Information:</h3>
                <p className="text-[#666666] leading-relaxed">
                  When you create an account, we collect your email address and password (stored securely using industry-standard encryption).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#333333] mb-2">User Content:</h3>
                <p className="text-[#666666] leading-relaxed">
                  We store the notes, journal entries, and any content you create within the app. This includes text content, images you upload, and audio recordings you make.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#333333] mb-2">Voice Recordings:</h3>
                <p className="text-[#666666] leading-relaxed">
                  When you use the voice recording feature, your audio is processed to convert speech to text. Audio recordings may be temporarily stored during processing and are deleted after transcription is complete unless you choose to keep them.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#333333] mb-2">Location Data (Optional):</h3>
                <p className="text-[#666666] leading-relaxed">
                  With your permission, we may access your location to provide weather information in your journal entries. This data is used only to fetch weather data and is not stored permanently.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#333333] mb-2">Device Information:</h3>
                <p className="text-[#666666] leading-relaxed">
                  We may collect information about your device, including device type, operating system, and unique device identifiers for app functionality and troubleshooting.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              How We Use Your Information
            </h2>
            <p className="text-[#666666] mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and store your journal entries and notes</li>
              <li>Sync your content across your devices</li>
              <li>Convert your voice recordings to text</li>
              <li>Provide weather information for your entries (if enabled)</li>
              <li>Send you service-related communications</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Data Storage and Security
            </h2>
            <p className="text-[#666666] leading-relaxed mb-4">
              Your data is stored securely using Supabase, a trusted cloud database provider. We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.
            </p>
            <p className="text-[#666666] leading-relaxed">
              All data transmission between your device and our servers is encrypted using industry-standard TLS/SSL protocols.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Third-Party Services
            </h2>
            <p className="text-[#666666] mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li><strong>Supabase:</strong> For secure data storage and authentication</li>
              <li><strong>OpenAI Whisper:</strong> For speech-to-text transcription</li>
              <li><strong>RevenueCat:</strong> For subscription management (iOS app only)</li>
              <li><strong>Weather API:</strong> For weather data (if location is enabled)</li>
            </ul>
            <p className="text-[#666666] mt-4">
              These services have their own privacy policies governing their use of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Data Sharing
            </h2>
            <p className="text-[#666666] mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in operating our service (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Your Rights
            </h2>
            <p className="text-[#666666] mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Withdraw consent for optional features (like location access)</li>
            </ul>
            <p className="text-[#666666] mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:privacy@nuron.life" className="text-[#E57373] hover:underline">
                privacy@nuron.life
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Data Retention
            </h2>
            <p className="text-[#666666] leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Children's Privacy
            </h2>
            <p className="text-[#666666] leading-relaxed">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Changes to This Policy
            </h2>
            <p className="text-[#666666] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-6">
              Contact Us
            </h2>
            <p className="text-[#666666] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:privacy@nuron.life" className="text-[#E57373] hover:underline">
                privacy@nuron.life
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#999999] text-sm">
            © 2025 Nuron. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
