import { Link } from "react-router-dom";
import nuronLogo from "@/assets/nuron_logo.png";

const Terms = () => {
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
          Terms of Service
        </h1>
        
        <p className="text-[#666666] mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-lg max-w-none text-[#666666]">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Agreement to Terms
            </h2>
            <p className="mb-4 leading-relaxed">
              By accessing or using Nuron, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Description of Service
            </h2>
            <p className="mb-4 leading-relaxed">
              Nuron is a note-taking and journaling application that allows you to capture 
              thoughts through voice recording, text, and images. The service includes cloud 
              synchronization, AI-powered transcription and rewriting, and the ability to 
              publish notes as blog posts.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              User Accounts
            </h2>
            <p className="mb-4 leading-relaxed">
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Acceptable Use
            </h2>
            <p className="mb-4 leading-relaxed">
              You agree not to use Nuron to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload or share illegal, harmful, or offensive content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use the service for spam or unauthorized commercial purposes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Content Ownership
            </h2>
            <p className="mb-4 leading-relaxed">
              You retain full ownership of all content you create in Nuron. By using our service, 
              you grant us a limited license to store, process, and display your content as 
              necessary to provide the service.
            </p>
            <p className="mb-4 leading-relaxed">
              When you publish content publicly, you are responsible for ensuring you have the 
              right to share that content and that it complies with these terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Published Content
            </h2>
            <p className="mb-4 leading-relaxed">
              When you choose to publish notes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your content becomes publicly accessible on the internet</li>
              <li>You are solely responsible for the content you publish</li>
              <li>You must not publish content that violates laws or third-party rights</li>
              <li>We reserve the right to remove published content that violates these terms</li>
              <li>You can unpublish content at any time</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Subscriptions and Payments
            </h2>
            <p className="mb-4 leading-relaxed">
              Nuron offers both free and paid subscription plans:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free tier: Unlimited notes on the web</li>
              <li>Pro subscription: Includes mobile app access, cloud sync, and AI features</li>
            </ul>
            <p className="mt-4 leading-relaxed">
              Subscriptions are billed monthly or annually and automatically renew unless cancelled. 
              You can cancel your subscription at any time through the App Store or your account settings.
            </p>
            <p className="mt-4 leading-relaxed">
              Refunds are handled according to Apple's App Store policies for iOS purchases.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              AI Features
            </h2>
            <p className="mb-4 leading-relaxed">
              Nuron uses artificial intelligence for transcription and text rewriting. While we 
              strive for accuracy, AI-generated content may contain errors. You are responsible 
              for reviewing and verifying AI-processed content before publishing.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Limitation of Liability
            </h2>
            <p className="mb-4 leading-relaxed">
              Nuron is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of data or content</li>
              <li>Service interruptions or downtime</li>
              <li>Errors in AI transcription or processing</li>
              <li>Unauthorized access to your account due to your failure to maintain security</li>
              <li>Any indirect, incidental, or consequential damages</li>
            </ul>
            <p className="mt-4 leading-relaxed">
              We recommend regularly backing up important content.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Termination
            </h2>
            <p className="mb-4 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these terms. 
              You may also delete your account at any time through the app settings.
            </p>
            <p className="mb-4 leading-relaxed">
              Upon termination, your data will be deleted in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Changes to Terms
            </h2>
            <p className="mb-4 leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Governing Law
            </h2>
            <p className="mb-4 leading-relaxed">
              These terms are governed by applicable law. Any disputes shall be resolved through 
              appropriate legal channels.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Contact Us
            </h2>
            <p className="mb-4 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@nuron.life" className="text-[#E57373] hover:underline">
                legal@nuron.life
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

export default Terms;
