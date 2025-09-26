'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type SanityEvent } from '@/lib/sanity';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';

// Form validation schema for hybrid registration
const hybridRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  attendanceType: z.enum(['in-person', 'online']),
  promoCode: z.string().optional(),
  // Billing information (required for paid in-person registrations)
  sameAsAttendee: z.boolean().optional(),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingEmail: z.string().optional(),
  billingPhone: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
});

type HybridRegistrationFormData = z.infer<typeof hybridRegistrationSchema>;

// Hybrid Payment Form Component
interface HybridPaymentFormProps {
  event: SanityEvent;
  selectedAttendanceType: 'in-person' | 'online';
  pricing: {
    inPersonPrice: number;
    onlinePrice: number;
    finalPrice: number;
    originalPrice?: number;
    discountApplied?: boolean;
    promoCodeApplied?: string;
    promoCodeDiscount?: number;
  };
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  promoCode?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

function HybridPaymentForm({
  event,
  selectedAttendanceType,
  pricing,
  attendeeInfo,
  promoCode,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: HybridPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent via hybrid API
      const response = await fetch('/api/events/register-hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.slug.current,
          attendeeInfo,
          attendanceType: selectedAttendanceType,
          promoCode,
          pricing,
        }),
      });

      const result = await response.json();
      console.log('Payment Intent Created:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      // Confirm payment with Stripe
      const paymentResult = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${attendeeInfo.firstName} ${attendeeInfo.lastName}`,
            email: attendeeInfo.email,
            phone: attendeeInfo.phone,
          },
        },
      });

      const { error: confirmError, paymentIntent } = paymentResult;

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded - webhook will handle registration');
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Complete your {selectedAttendanceType === 'in-person' ? 'in-person' : 'online livestream'} registration payment.
      </p>
      
      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  fontFamily: '"Inter", system-ui, sans-serif',
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }} 
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-blue-800 text-sm font-medium">
            Your payment information is secure and encrypted.
          </span>
        </div>
      </div>

      {/* Payment Button */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </div>
        ) : (
          `Complete Registration - $${pricing.finalPrice.toFixed(2)}`
        )}
      </button>
    </div>
  );
}

interface HybridEventRegistrationFormProps {
  event: SanityEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function HybridEventRegistrationForm({ 
  event, 
  isOpen, 
  onClose, 
  onSuccess 
}: HybridEventRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pricing, setPricing] = useState<{
    inPersonPrice: number;
    onlinePrice: number;
    finalPrice: number;
    originalPrice?: number;
    discountApplied?: boolean;
    promoCodeApplied?: string;
    promoCodeDiscount?: number;
  }>({
    inPersonPrice: event.price || 0,
    onlinePrice: event.onlinePrice || 0,
    finalPrice: event.price || 0,
  });
  const [promoCodeStatus, setPromoCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    trigger,
  } = useForm<HybridRegistrationFormData>({
    // Only use resolver on the final step
    resolver: currentStep === 3 ? zodResolver(hybridRegistrationSchema) : undefined,
    mode: 'onChange',
  });

  const selectedAttendanceType = watch('attendanceType');
  const promoCode = watch('promoCode');

  // Debug logging (can be removed in production)
  // console.log('Current form state:', { 
  //   selectedAttendanceType, 
  //   currentStep, 
  //   errors: Object.keys(errors),
  //   isSubmitting 
  // });

  // Update final price when attendance type changes
  useEffect(() => {
    if (selectedAttendanceType === 'in-person') {
      setPricing(prev => ({ 
        ...prev, 
        finalPrice: prev.inPersonPrice,
        originalPrice: undefined,
        discountApplied: false,
        promoCodeApplied: undefined,
        promoCodeDiscount: undefined,
      }));
    } else if (selectedAttendanceType === 'online') {
      setPricing(prev => ({ 
        ...prev, 
        finalPrice: prev.onlinePrice,
        originalPrice: undefined,
        discountApplied: false,
        promoCodeApplied: undefined,
        promoCodeDiscount: undefined,
      }));
    }
  }, [selectedAttendanceType, pricing.inPersonPrice, pricing.onlinePrice]);

  const formatEventDate = () => {
    if (!event.eventSchedule || event.eventSchedule.length === 0) {
      return 'Date & Time TBD';
    }

    const firstSession = event.eventSchedule[0];
    if (!firstSession.startTime) {
      return 'Date & Time TBD';
    }

    const startDate = new Date(firstSession.startTime);
    const endDate = new Date(firstSession.endTime);

    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York',
    });

    const timeStr = `${startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })} - ${endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })}`;

    return { date: dateStr, time: timeStr };
  };

  const validatePromoCode = async () => {
    if (!promoCode?.trim()) return;
    
    setPromoCodeStatus('checking');
    
    try {
      const response = await fetch('/api/events/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.slug.current,
          promoCode: promoCode.trim(),
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setPromoCodeStatus('valid');
        const basePrice = selectedAttendanceType === 'online' ? pricing.onlinePrice : pricing.inPersonPrice;
        const discountAmount = (basePrice * result.discountPercent) / 100;
        const finalPrice = Math.max(0, basePrice - discountAmount);
        
        setPricing(prev => ({
          ...prev,
          originalPrice: basePrice,
          finalPrice,
          discountApplied: true,
          promoCodeApplied: result.promoCode,
          promoCodeDiscount: result.discountPercent,
        }));
      } else {
        setPromoCodeStatus('invalid');
        setPricing(prev => ({
          ...prev,
          finalPrice: selectedAttendanceType === 'online' ? prev.onlinePrice : prev.inPersonPrice,
          originalPrice: undefined,
          discountApplied: false,
          promoCodeApplied: undefined,
          promoCodeDiscount: undefined,
        }));
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeStatus('invalid');
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const nextStep = () => {
    // Show 4 steps for any paid registration (in-person OR online with price > 0)
    const maxSteps = pricing.finalPrice > 0 ? 4 : 3;
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
      setSubmitError(null); // Clear errors when moving to next step
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSubmitError(null); // Clear errors when moving to previous step
    }
  };

  const onSubmit = async (data: HybridRegistrationFormData) => {
    
    if (currentStep === 1) {
      // Validate only attendance type for step 1
      const isValid = await trigger('attendanceType');
      if (!isValid || !data.attendanceType) {
        setSubmitError('Please select your attendance preference');
        return;
      }
      setSubmitError(null);
      nextStep();
      return;
    }
    
    if (currentStep === 2) {
      // Validate personal information for step 2
      const fieldsToValidate = ['firstName', 'lastName', 'email'] as const;
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) {
        setSubmitError('Please fill in all required fields');
        return;
      }
      setSubmitError(null);
      nextStep();
      return;
    }
    
    if (currentStep === 3) {
      // For step 3, check if we need payment (any paid registration) or can proceed
      if (pricing.finalPrice > 0) {
        // Need payment - go to step 4 (payment)
        nextStep();
        return;
      } else {
        // Free registration - proceed with final submission
        // Fall through to final submission logic
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Free online registrations use the immediate endpoint
      // Paid registrations (both online and in-person) use the webhook endpoint
      const endpoint = data.attendanceType === 'online' && pricing.finalPrice === 0
        ? '/api/events/register-hybrid-online'
        : '/api/events/register-hybrid';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.slug.current,
          attendeeInfo: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
          },
          attendanceType: data.attendanceType,
          promoCode: data.promoCode,
          pricing,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      if (data.attendanceType === 'online') {
        // Show success for online registration
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
        }, 3000);
      } else {
        // Redirect to Stripe for in-person payment
        if (result.clientSecret) {
          // Handle Stripe payment (similar to existing flow)
          console.log('Redirect to payment:', result.clientSecret);
        }
      }

    } catch (error) {
      console.error('Hybrid registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setSubmitError(null);
    setIsSuccess(false);
    setIsSubmitting(false);
    setPromoCodeStatus('idle');
    setPricing({
      inPersonPrice: event.price || 0,
      onlinePrice: event.onlinePrice || 0,
      finalPrice: event.price || 0,
    });
    onClose();
  };

  if (!isOpen) return null;

  const eventDateInfo = formatEventDate();

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white p-6 rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1 pr-4">
                <h2 className="text-lg sm:text-2xl font-bold font-montserrat leading-tight">
                  Event Registration
                </h2>
                <p className="text-purple-100 mt-1 text-sm sm:text-base leading-tight">
                  {event.title} - Choose Your Experience
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="text-white hover:text-purple-200 transition-colors relative z-20 flex-shrink-0 p-1"
                aria-label="Close form"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center mt-4 relative z-10">
              {[1, 2, 3, ...(pricing.finalPrice > 0 ? [4] : [])].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-white text-purple-600' 
                      : 'bg-purple-500 text-white border border-purple-400'
                  }`}>
                    {step}
                  </div>
                  {step < (pricing.finalPrice > 0 ? 4 : 3) && (
                    <div className={`h-1 w-8 mx-2 rounded ${
                      currentStep > step ? 'bg-white' : 'bg-purple-500'
                    }`} />
                  )}
                </div>
              ))}
              <div className="ml-4 text-sm text-purple-100">
                Step {currentStep} of {pricing.finalPrice > 0 ? 4 : 3}
              </div>
            </div>
          </div>

          <div className="p-6">
            {isSuccess ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h3>
                <p className="text-gray-600 mb-4">
                  You&apos;re all set for <strong>{event.title}</strong>. 
                  {selectedAttendanceType === 'online' 
                    ? ' Your livestream access details have been sent to your email.'
                    : ' A confirmation email has been sent to your email address.'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  This window will close automatically...
                </p>
              </motion.div>
            ) : (
              /* Registration Form */
              <>
                {/* Steps 1-3: Form wrapper */}
                {currentStep !== 4 && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step 1: Attendance Type Selection */}
                    {currentStep === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Experience</h3>
                    
                    {/* Event Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-purple-800 mb-2">{event.title}</h4>
                      <div className="text-purple-700 text-sm space-y-1">
                        {typeof eventDateInfo === 'object' ? (
                          <>
                            <p><strong>Date:</strong> {eventDateInfo.date}</p>
                            <p><strong>Time:</strong> {eventDateInfo.time}</p>
                          </>
                        ) : (
                          <p><strong>Date & Time:</strong> {eventDateInfo}</p>
                        )}
                        {event.location?.name && (
                          <p><strong>Location:</strong> {event.location.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Attendance Options */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* In-Person Option */}
                        <label className={`relative flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedAttendanceType === 'in-person' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}>
                          <input
                            type="radio"
                            value="in-person"
                            {...register('attendanceType')}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">In-Person Attendance</h4>
                            <span className="text-lg font-bold text-purple-600">
                              {formatPrice(pricing.inPersonPrice)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Join us live at the venue with full interaction and networking opportunities.
                          </p>
                          <div className="text-xs text-gray-500">
                            • Live interaction with speakers
                            • Networking opportunities
                            • Refreshments included
                            {event.registrationLimit && (
                              <span className="block text-orange-600 font-medium mt-1">
                                ⚠️ Limited to {event.registrationLimit} attendees
                              </span>
                            )}
                          </div>
                        </label>

                        {/* Online Option */}
                        <label className={`relative flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedAttendanceType === 'online' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}>
                          <input
                            type="radio"
                            value="online"
                            {...register('attendanceType')}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Online Livestream</h4>
                            <span className="text-lg font-bold text-purple-600">
                              {formatPrice(pricing.onlinePrice)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Watch the event live from anywhere with interactive Q&A chat.
                          </p>
                          <div className="text-xs text-gray-500">
                            • HD livestream access
                            • Real-time Q&A chat
                            • Watch from any device
                            • Unlimited capacity
                          </div>
                        </label>
                      </div>
                      
                      {errors.attendanceType && (
                        <p className="text-red-500 text-sm">{errors.attendanceType.message}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Personal Information */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                    
                    {/* Selected Option Summary */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {selectedAttendanceType === 'in-person' ? '🎯 In-Person Attendance' : '💻 Online Livestream'}
                        </span>
                        <span className="font-bold text-purple-600">
                          {formatPrice(selectedAttendanceType === 'online' ? pricing.onlinePrice : pricing.inPersonPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Personal Info Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          {...register('firstName')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter your first name"
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
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter your last name"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter your email address"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter your phone number"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Promo Code - Only show for in-person attendance */}
                    {selectedAttendanceType === 'in-person' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Promo Code (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            {...register('promoCode')}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Enter promo code"
                          />
                          <button
                            type="button"
                            onClick={validatePromoCode}
                            disabled={!promoCode?.trim() || promoCodeStatus === 'checking'}
                            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {promoCodeStatus === 'checking' ? 'Checking...' : 'Apply'}
                          </button>
                        </div>
                        
                        {promoCodeStatus === 'valid' && (
                          <p className="text-green-600 text-sm mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Promo code applied! {pricing.promoCodeDiscount}% discount
                          </p>
                        )}
                        
                        {promoCodeStatus === 'invalid' && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Invalid promo code
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Review & Payment */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Complete</h3>
                    
                    {/* Registration Summary */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Registration Summary</h4>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Event:</span>
                          <span className="font-medium">{event.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendance:</span>
                          <span className="font-medium">
                            {selectedAttendanceType === 'in-person' ? 'In-Person' : 'Online Livestream'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="font-medium">{watch('firstName')} {watch('lastName')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-medium">{watch('email')}</span>
                        </div>
                        
                        <hr className="my-4" />
                        
                        {pricing.discountApplied && pricing.originalPrice && (
                          <>
                            <div className="flex justify-between text-gray-500">
                              <span>Original Price:</span>
                              <span className="line-through">{formatPrice(pricing.originalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Discount ({pricing.promoCodeApplied}):</span>
                              <span>-{formatPrice(pricing.originalPrice - pricing.finalPrice)}</span>
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-between text-lg font-bold text-purple-600">
                          <span>Total:</span>
                          <span>{formatPrice(pricing.finalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedAttendanceType === 'online' && pricing.finalPrice === 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-green-800 text-sm">
                          🎉 This is a free online event! Click &quot;Complete Registration&quot; to secure your spot.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}


                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800 text-sm">{submitError}</span>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep !== 4 && ( // Hide navigation on payment step - StripePaymentForm handles its own buttons
                  <div className="flex justify-between pt-6">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    
                    <div className="flex-1" />
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : currentStep === 3 ? (
                      pricing.finalPrice === 0
                        ? 'Complete Free Registration'
                        : 'Continue to Payment'
                    ) : (
                      'Continue'
                    )}
                  </button>
                  </div>
                )}

                    <p className="text-xs text-gray-500 text-center mt-4">
                      By registering, you agree to receive event updates and confirmations via email.
                    </p>
                  </form>
                )}

                {/* Step 4: Payment - No form wrapper, StripePaymentForm handles its own form */}
                {currentStep === 4 && pricing.finalPrice > 0 && (
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                      
                      {/* Registration Summary */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            {selectedAttendanceType === 'in-person' ? 'In-Person Registration' : 'Online Livestream Registration'}
                          </span>
                          <span className="font-bold text-purple-600">{formatPrice(pricing.finalPrice)}</span>
                        </div>
                      </div>

                      {/* Hybrid Stripe Payment Integration */}
                      <Elements stripe={getStripe()}>
                        <HybridPaymentForm
                          event={event}
                          selectedAttendanceType={selectedAttendanceType!}
                          pricing={pricing}
                          attendeeInfo={{
                            firstName: watch('firstName'),
                            lastName: watch('lastName'),
                            email: watch('email'),
                            phone: watch('phone') || '',
                          }}
                          promoCode={watch('promoCode')}
                          onSuccess={() => {
                            setIsSuccess(true);
                            setTimeout(() => {
                              handleClose();
                              if (onSuccess) onSuccess();
                            }, 15000);
                          }}
                          onError={setSubmitError}
                          isProcessing={isSubmitting}
                          setIsProcessing={setIsSubmitting}
                        />
                      </Elements>
                    </motion.div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      By registering, you agree to receive event updates and confirmations via email.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
