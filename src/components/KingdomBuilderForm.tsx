'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StripePaymentForm from './StripePaymentForm';

// Form validation schema
const kingdomBuilderSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Please enter your address'),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().min(2, 'Please enter your state'),
  zipCode: z.string().min(5, 'Please enter your ZIP code'),
  donationType: z.enum(['one-time', 'monthly', 'custom']),
  amount: z.number().min(10, 'Minimum donation is $10'),
  customAmount: z.number().optional(),
  motivationMessage: z.string().optional(),
});

type KingdomBuilderFormData = z.infer<typeof kingdomBuilderSchema>;

interface KingdomBuilderFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const donationAmounts = [
  { value: 25, label: '$25' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 250, label: '$250' },
  { value: 500, label: '$500' },
  { value: 1000, label: '$1,000' },
];

export default function KingdomBuilderForm({ isOpen, onClose }: KingdomBuilderFormProps) {
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    register,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<KingdomBuilderFormData>({
    resolver: zodResolver(kingdomBuilderSchema),
    defaultValues: {
      donationType: 'one-time',
    },
  });

  const donationType = watch('donationType');

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomAmount(false);
    setValue('amount', amount);
  };

  const handleCustomAmount = () => {
    setIsCustomAmount(true);
    setSelectedAmount(null);
  };

  const handlePaymentSuccess = () => {
    alert('Thank you for becoming a Kingdom Builder! You will receive a confirmation email shortly.');
    reset();
    setStep(1);
    setSelectedAmount(null);
    setIsCustomAmount(false);
    setPaymentError(null);
    onClose();
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-montserrat">
                  Become a Kingdom Builder
                </h2>
                <p className="text-yellow-100 mt-2">
                  Join us in building God&apos;s Kingdom at 605 Wells
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-white hover:text-yellow-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress indicator */}
            <div className="flex mt-6 space-x-2">
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

          <div className="p-6">
            {/* Step 1: Donation Amount */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Choose Your Impact</h3>
                
                {/* Donation Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Donation Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['one-time', 'monthly', 'custom'].map((type) => (
                      <label key={type} className="cursor-pointer">
                        <input
                          type="radio"
                          value={type}
                          {...register('donationType')}
                          className="sr-only"
                        />
                        <div className={`p-3 text-center border-2 rounded-lg transition-all ${
                          donationType === type
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="font-semibold capitalize">{type.replace('-', ' ')}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Amount {donationType === 'monthly' && '(Monthly)'}
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {donationAmounts.map((amount) => (
                      <button
                        key={amount.value}
                        type="button"
                        onClick={() => handleAmountSelect(amount.value)}
                        className={`p-4 text-center border-2 rounded-lg transition-all font-semibold ${
                          selectedAmount === amount.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {amount.label}
                        {donationType === 'monthly' && <div className="text-xs text-gray-500">per month</div>}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Amount */}
                  <button
                    type="button"
                    onClick={handleCustomAmount}
                    className={`w-full p-4 text-center border-2 rounded-lg transition-all font-semibold mb-4 ${
                      isCustomAmount
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Custom Amount
                  </button>

                  {isCustomAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Custom Amount
                      </label>
                      <input
                        type="number"
                        min="10"
                        placeholder="Enter amount"
                        {...register('amount', { valueAsNumber: true })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!selectedAmount && !isCustomAmount}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-4 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Personal Information
                </button>
              </motion.div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
                
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
                <h3 className="text-xl font-bold text-gray-900 mb-6">Complete Your Donation</h3>
                
                {/* Donation Summary */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-orange-800 mb-2">Donation Summary</h4>
                  <div className="text-orange-700">
                    <p>Amount: ${selectedAmount || watch('amount')} {donationType === 'monthly' && '(Monthly)'}</p>
                    <p>Type: {donationType.replace('-', ' ').charAt(0).toUpperCase() + donationType.slice(1).replace('-', ' ')}</p>
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
                    placeholder="Tell us what motivates you to become a Kingdom Builder..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Stripe Payment Form */}
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
                
                <StripePaymentForm
                  amount={selectedAmount || watch('amount')}
                  donationType={donationType}
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
                >
                  Back to Personal Information
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 