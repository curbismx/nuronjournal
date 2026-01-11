import { Link } from "react-router-dom";
import nuronLogo from "@/assets/nuron_logo.png";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white font-outfit">
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
          Terms of Service
        </h1>
        
        <p className="text-[#999999] mb-12">
          Last updated: January 2025
        </p>

        <p className="text-[#666666] leading-relaxed mb-12">
          Welcome to Nuron. By accessing or using our service, you agree to be bound by these Terms of Service. Please read them carefully.
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#666666] leading-relaxed">
              By creating an account or using Nuron, you agree to these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              2. Description of Service
            </h2>
            <p className="text-[#666666] leading-relaxed">
              Nuron is a voice-powered journaling application that allows you to capture thoughts through voice recording, organise notes into folders, and optionally publish content to the web. The service is available via web browser and iOS application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              3. User Accounts
            </h2>
            <p className="text-[#666666] mb-4">To use certain features of Nuron, you must create an account. You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li>Providing accurate and complete information</li>
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorised use</li>
            </ul>
            <p className="text-[#666666] mt-4">
              You must be at least 13 years old to create an account and use Nuron.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              4. User Content
            </h2>
            <p className="text-[#666666] leading-relaxed mb-4">
              <strong>Ownership:</strong> You retain all ownership rights to the content you create in Nuron. Your notes, journal entries, images, and recordings remain yours.
            </p>
            <p className="text-[#666666] leading-relaxed mb-4">
              <strong>License to Nuron:</strong> By using our service, you grant us a limited license to store, process, and display your content solely for the purpose of providing the service to you. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li>Storing your content on our servers</li>
              <li>Processing voice recordings for transcription</li>
              <li>Syncing content across your devices</li>
              <li>Displaying published content to viewers (if you choose to publish)</li>
            </ul>
            <p className="text-[#666666] leading-relaxed mt-4">
              <strong>Published Content:</strong> When you publish a folder to the web, you acknowledge that the content will be publicly accessible (or accessible to those with the password, if you set one). You are solely responsible for the content you publish.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              5. Acceptable Use
            </h2>
            <p className="text-[#666666] mb-4">You agree not to use Nuron to:</p>
            <ul className="list-disc pl-6 space-y-2 text-[#666666]">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Upload or publish content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Distribute malware or harmful code</li>
              <li>Attempt to gain unauthorised access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              6. Subscription and Payment
            </h2>
            <p className="text-[#666666] leading-relaxed mb-4">
              <strong>Free Tier:</strong> Basic features of Nuron are available for free on the web.
            </p>
            <p className="text-[#666666] leading-relaxed mb-4">
              <strong>Nuron Pro:</strong> Premium features, including cross-device sync and the iOS app, require a paid subscription. Subscriptions are managed through the Apple App Store and are subject to Apple's terms and conditions.
            </p>
            <p className="text-[#666666] leading-relaxed mb-4">
              <strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis. You can manage or cancel your subscription through your App Store account settings.
            </p>
            <p className="text-[#666666] leading-relaxed">
              <strong>Refunds:</strong> Refund requests for App Store purchases are handled by Apple according to their refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-[#666666] leading-relaxed mb-4">
              The Nuron service, including its design, features, and code, is owned by Nuron and protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the service without our written permission.
            </p>
            <p className="text-[#666666] leading-relaxed">
              The Nuron name, logo, and associated branding are trademarks of Nuron. You may not use these without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              8. Third-Party Services
            </h2>
            <p className="text-[#666666] leading-relaxed">
              Nuron integrates with third-party services for functionality such as authentication, storage, and transcription. Your use of these integrated services is subject to their respective terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-[#666666] leading-relaxed mb-4">
              Nuron is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>
            <p className="text-[#666666] leading-relaxed">
              We make no warranties regarding the accuracy or reliability of transcriptions generated from voice recordings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-[#666666] leading-relaxed">
              To the fullest extent permitted by law, Nuron shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              11. Indemnification
            </h2>
            <p className="text-[#666666] leading-relaxed">
              You agree to indemnify and hold harmless Nuron and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of the service or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              12. Termination
            </h2>
            <p className="text-[#666666] leading-relaxed mb-4">
              We may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the service will cease immediately.
            </p>
            <p className="text-[#666666] leading-relaxed">
              You may delete your account at any time through the app settings. Upon account deletion, your data will be permanently removed in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              13. Changes to Terms
            </h2>
            <p className="text-[#666666] leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by updating the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              14. Governing Law
            </h2>
            <p className="text-[#666666] leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which Nuron operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              15. Contact Us
            </h2>
            <p className="text-[#666666] leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:{" "}
              <a href="mailto:legal@nuron.life" className="text-[#E57373] hover:underline">
                legal@nuron.life
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

export default Terms;
