'use client';

import { useState, useEffect } from 'react';
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
  donationType: z.enum(['one-time', 'monthly']),
  amount: z.number().min(1, 'Minimum donation is $1'),
  motivationMessage: z.string().optional(),
});

type KingdomBuilderFormData = z.infer<typeof kingdomBuilderSchema>;

interface KingdomBuilderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (donationType: 'monthly' | 'one-time') => void;
}

const monthlyAmounts = [
  { value: 120, label: '$120', featured: true, description: 'Join our core mission!' },
  { value: 60, label: '$60' },
  { value: 180, label: '$180' },
  { value: 240, label: '$240' },
];

// Removed oneTimeAmounts - using direct input for one-time donations

export default function KingdomBuilderForm({ isOpen, onClose, onPaymentSuccess }: KingdomBuilderFormProps) {
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(120); // Default to $120 goal
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
      donationType: 'monthly',
      amount: 120, // Default to $120 goal amount
    },
  });

  const donationType = watch('donationType');

  // Ensure form initializes with correct defaults when opened
  useEffect(() => {
    if (isOpen) {
      setValue('donationType', 'monthly');
      setValue('amount', 120);
      setSelectedAmount(120);
    }
  }, [isOpen, setValue]);

  // Reset amount when switching donation types
  useEffect(() => {
    if (donationType === 'monthly') {
      setSelectedAmount(120);
      setValue('amount', 120);
    } else if (donationType === 'one-time') {
      setSelectedAmount(null);
      setValue('amount', 0); // Will be set by user input
    }
  }, [donationType, setValue]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setValue('amount', amount);
  };

  const handlePaymentSuccess = () => {
    reset({
      donationType: 'monthly',
      amount: 120,
    });
    setStep(1);
    setSelectedAmount(120);
    setPaymentError(null);
    
    // Call the parent success handler if provided
    if (onPaymentSuccess) {
      onPaymentSuccess(donationType);
    } else {
      // Fallback for backward compatibility
      const message = donationType === 'monthly' 
        ? 'Thank you for becoming a Kingdom Builder! You will receive a confirmation email shortly.'
        : 'Thank you for your generous gift! You will receive a confirmation email shortly.';
      alert(message);
      onClose();
    }
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
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 text-white p-6 rounded-t-2xl relative overflow-hidden">
            {/* Animated border beam effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 opacity-20 animate-pulse"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1 pr-4">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold font-montserrat leading-tight">
                  Become a Kingdom Builder
                </h2>
                <p className="text-yellow-100 mt-1 sm:mt-2 text-sm sm:text-base leading-tight">
                  Join us in building God&apos;s Kingdom at 605 Wells
                </p>
              </div>
              <button 
                onClick={onClose}
                className="text-white hover:text-yellow-200 transition-colors relative z-20 flex-shrink-0 p-1"
                aria-label="Close form"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Join the Kingdom Builder Community</h3>
                
                                 {/* Mission Statement */}
                 <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-300 opacity-20"></div>
                   <div className="relative z-10">
                     <h4 className="font-semibold text-purple-800 mb-2">Our Goal: 120 Kingdom Builders</h4>
                     <p className="text-purple-700 text-sm">
                       We&apos;re seeking 120 committed Kingdom Builders to partner with us monthly at $120 each 
                       for the next 12 months to transform 605 Wells into a regional Kingdom Hub.
                     </p>
                   </div>
                 </div>

                                 {/* Kingdom Builder Benefits */}
                 <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-300 opacity-20"></div>
                   <div className="relative z-10">
                     <h4 className="font-semibold text-blue-800 mb-3">Kingdom Builder Benefits</h4>
                     <ul className="text-blue-700 text-sm space-y-1">
                       <li>• 50% off all registration fees within 605 Wells</li>
                       <li>• Waived application fees for trips</li>
                       <li>• Waived admission fee into Kingdom Champions College</li>
                     </ul>
                   </div>
                 </div>
                
                {/* Donation Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Your Kingdom Builder Path
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                                         <label className="cursor-pointer">
                       <input
                         type="radio"
                         value="monthly"
                         {...register('donationType')}
                         className="sr-only"
                       />
                       <div className={`p-4 text-center border-2 rounded-lg transition-all relative overflow-hidden ${
                         donationType === 'monthly'
                           ? 'border-transparent bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}>
                         {donationType === 'monthly' && (
                           <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-[2px] rounded-lg">
                             <div className="h-full w-full bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"></div>
                           </div>
                         )}
                         <div className="relative z-10">
                           <div className="font-bold text-lg">Monthly Partner</div>
                           <div className="text-sm text-gray-600">Join our core mission</div>
                           {donationType === 'monthly' && (
                             <div className="text-xs text-purple-600 mt-1">✓ Full Kingdom Builder benefits</div>
                           )}
                         </div>
                       </div>
                     </label>
                                         <label className="cursor-pointer">
                       <input
                         type="radio"
                         value="one-time"
                         {...register('donationType')}
                         className="sr-only"
                       />
                       <div className={`p-4 text-center border-2 rounded-lg transition-all relative overflow-hidden ${
                         donationType === 'one-time'
                           ? 'border-transparent bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}>
                         {donationType === 'one-time' && (
                           <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-[2px] rounded-lg">
                             <div className="h-full w-full bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"></div>
                           </div>
                         )}
                         <div className="relative z-10">
                           <div className="font-bold text-lg">One-Time Gift</div>
                           <div className="text-sm text-gray-600">Support the vision</div>
                           {donationType === 'one-time' && (
                             <div className="text-xs text-purple-600 mt-1">✓ Every gift makes a difference</div>
                           )}
                         </div>
                       </div>
                     </label>
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {donationType === 'monthly' ? 'Select Monthly Amount' : 'Select One-Time Amount'}
                  </label>
                  
                  {donationType === 'monthly' ? (
                                        <div className="grid grid-cols-2 gap-3 mb-4 pt-3">
                      {monthlyAmounts.map((amount) => (
                        <button
                           key={amount.value}
                           type="button"
                           onClick={() => handleAmountSelect(amount.value)}
                           className={`p-4 text-center border-2 rounded-lg transition-all font-semibold relative ${
                             selectedAmount === amount.value
                               ? 'border-transparent bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                               : 'border-gray-200 hover:border-gray-300'
                           }`}
                         >
                           {selectedAmount === amount.value && (
                             <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-[2px] rounded-lg overflow-hidden">
                               <div className="h-full w-full bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"></div>
                             </div>
                           )}
                           {amount.featured && (
                             <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                               GOAL
                             </div>
                           )}
                           <div className="relative z-10">
                             <div className="text-lg">{amount.label}</div>
                             <div className="text-xs text-gray-500">per month</div>
                             {amount.description && (
                               <div className={`text-xs mt-1 ${selectedAmount === amount.value ? 'text-purple-600' : 'text-blue-600'}`}>{amount.description}</div>
                             )}
                           </div>
                         </button>
                      ))}
                    </div>
                                    ) : (
                    <div className="mb-4 pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Your Donation Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="0.00"
                          {...register('amount', { valueAsNumber: true })}
                          className="w-full pl-8 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Enter any amount you feel led to give (minimum $1)
                      </p>
                    </div>
                  )}

                  
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={donationType === 'monthly' ? !selectedAmount : !watch('amount') || watch('amount') < 1}
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
                   <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-300 opacity-20"></div>
                     <div className="relative z-10">
                       <h4 className="font-semibold text-purple-800 mb-2">Your Kingdom Builder Commitment</h4>
                       <div className="text-purple-700">
                         <p className="font-semibold">Amount: ${selectedAmount || watch('amount')} {donationType === 'monthly' && '(Monthly)'}</p>
                         <p>Path: {donationType === 'monthly' ? 'Monthly Partner' : 'One-Time Gift'}</p>
                         {donationType === 'monthly' && (
                           <p className="text-sm mt-2 text-purple-600">
                             ✓ You&apos;ll receive full Kingdom Builder benefits
                           </p>
                         )}
                       </div>
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