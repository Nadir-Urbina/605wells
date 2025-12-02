'use client';

import { useState } from 'react';
import CustomKingdomBuilderForm from '@/components/CustomKingdomBuilderForm';

export default function CustomKingdomBuilderPage() {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handlePaymentSuccess = () => {
    setShowSuccessMessage(true);

    // Hide success message after 10 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold text-green-800 mb-1">Welcome to Kingdom Builders!</h3>
                <p className="text-green-700 text-sm">
                  Thank you for your generous commitment. You will receive a confirmation email shortly with your Kingdom Builder benefits details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-montserrat mb-4">
              Custom Kingdom Builder Commitment
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <CustomKingdomBuilderForm onPaymentSuccess={handlePaymentSuccess} />
      </div>
    </div>
  );
}
