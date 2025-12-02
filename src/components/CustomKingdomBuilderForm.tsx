'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StripePaymentForm from './StripePaymentForm';

// Form validation schema
const customKingdomBuilderSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Please enter your address'),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().min(2, 'Please enter your state'),
  zipCode: z.string().min(5, 'Please enter your ZIP code'),
  amount: z.number().min(500, 'Minimum custom commitment is $500'),
  motivationMessage: z.string().optional(),
});

type CustomKingdomBuilderFormData = z.infer<typeof customKingdomBuilderSchema>;

interface CustomKingdomBuilderFormProps {
  onPaymentSuccess?: () => void;
}

export default function CustomKingdomBuilderForm({ onPaymentSuccess }: CustomKingdomBuilderFormProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    register,
    formState: { errors },
    watch,
    reset,
  } = useForm<CustomKingdomBuilderFormData>({
    resolver: zodResolver(customKingdomBuilderSchema),
  });

  const handlePaymentSuccess = () => {
    reset();
    setStep(1);
    setPaymentError(null);

    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Progress indicator */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 p-6">
        <div className="flex space-x-2">
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`flex-1 h-2 rounded-full ${
                stepNumber <= step ? 'bg-yellow-200' : 'bg-yellow-400/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Step 1: Custom Amount */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Custom Kingdom Builder Commitment</h3>

            {/* Custom Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter Your Monthly Commitment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-2xl font-bold">$</span>
                <input
                  type="number"
                  min="500"
                  step="50"
                  placeholder="500"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-12 pr-4 py-5 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-2">{errors.amount.message}</p>
              )}
              <div className="mt-3 space-y-1">
                <p className="text-sm text-gray-600">
                  <strong>Minimum commitment: $500/month</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Suggested amounts: $500, $750, $1,000, $2,500, $5,000+
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={nextStep}
              disabled={!watch('amount') || watch('amount') < 500}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-5 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-8"
            >
              Continue to Personal Information
            </button>

            {/* Impact Statement */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm text-yellow-800">
                  Your ${watch('amount') || 500}/month commitment over 12 months = <strong>${((watch('amount') || 500) * 12).toLocaleString()}</strong> total impact toward renovating 605 Wells into a Kingdom Hub serving Jacksonville and beyond.
                </p>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-purple-800 mb-3 text-lg">Join Kingdom Builders</h4>
              <p className="text-purple-700">
                As a custom Kingdom Builder, you&apos;re making an extraordinary commitment to transform 605 Wells
                into a regional Kingdom Hub. Your generous monthly partnership accelerates our mission and makes
                a profound impact in our community.
              </p>
            </div>

            {/* Kingdom Builder Benefits */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-blue-900 mb-4 text-lg flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Your Kingdom Builder Benefits
              </h4>
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>50% off all registration fees</strong> for any 605 Wells event or conference</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Waived application fees</strong> for all missions trips and Kingdom outreaches</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Free admission</strong> to Kingdom Champions College (annual value: $500+)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Exclusive updates</strong> on renovation progress and Kingdom impact stories</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Priority access</strong> to special events, teaching series, and Kingdom initiatives</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  {...register('zipCode')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg hover:border-gray-400 transition-all duration-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-4 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300"
              >
                Continue to Payment
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment & Message */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Kingdom Builder Commitment</h3>

            {/* Donation Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-purple-800 mb-3 text-lg">Your Monthly Partnership</h4>
              <div className="text-purple-700">
                <p className="text-2xl font-bold mb-2">${watch('amount')}/month</p>
                <p className="text-sm">Recurring monthly commitment</p>
                <p className="text-sm mt-3 text-purple-600 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Full Kingdom Builder benefits included
                </p>
              </div>
            </div>

            {/* Optional Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Your Heart (Optional)
              </label>
              <textarea
                {...register('motivationMessage')}
                rows={4}
                placeholder="Tell us what motivates you to become a Kingdom Builder at this level..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Payment Error Display */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 text-sm">{paymentError}</span>
                </div>
              </div>
            )}

            {/* Stripe Payment Form */}
            <StripePaymentForm
              amount={watch('amount')}
              donationType="monthly"
              isCustomAmount={true}
              customerInfo={{
                firstName: watch('firstName'),
                lastName: watch('lastName'),
                email: watch('email'),
                phone: watch('phone'),
                address: watch('address'),
                city: watch('city'),
                state: watch('state'),
                zipCode: watch('zipCode'),
              }}
              motivationMessage={watch('motivationMessage')}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />

            <button
              type="button"
              onClick={prevStep}
              className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg hover:border-gray-400 transition-all duration-300 mt-6"
              disabled={isProcessing}
            >
              Back to Personal Information
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
