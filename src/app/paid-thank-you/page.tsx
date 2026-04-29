import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Registration Confirmed | 605 Wells',
  description: 'Your event registration has been confirmed.',
};

export default function PaidThankYouPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            You&apos;re registered!
          </h1>

          <p className="text-gray-600 text-lg mb-6">
            Your registration has been confirmed and your payment was processed successfully.
          </p>

          <div className="bg-purple-50 border border-purple-100 rounded-xl px-6 py-5 text-left mb-8 space-y-2">
            <p className="text-gray-700">
              A confirmation email should arrive in your inbox within the next <strong>10 minutes</strong>.
            </p>
            <p className="text-gray-700">
              Please also check your <strong>spam or junk folder</strong> if you don&apos;t see it.
            </p>
          </div>

          <Link
            href="/"
            className="inline-block bg-purple-700 hover:bg-purple-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>

          <p className="mt-8 text-sm text-gray-500">
            Having trouble?{' '}
            <a
              href="mailto:admin@eastgatejax.com"
              className="text-purple-700 hover:underline font-medium"
            >
              admin@eastgatejax.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
