'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StripePaymentForm from './StripePaymentForm';
import { type SanityEvent, type EventSession } from '@/lib/sanity';

// Form validation schema
const eventRegistrationSchema = z.object({
  // Attendee information
  attendeeFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  attendeeLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  attendeeEmail: z.string().email('Please enter a valid email address'),
  attendeePhone: z.string().min(10, 'Please enter a valid phone number').optional(),
  
  // Customer/billing information (can be same as attendee)
  sameAsAttendee: z.boolean(),
  customerFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  customerLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  customerAddress: z.string().min(5, 'Please enter your address'),
  customerCity: z.string().min(2, 'Please enter your city'),
  customerState: z.string().min(2, 'Please enter your state'),
  customerZipCode: z.string().min(5, 'Please enter your ZIP code'),
  
  // Promo code (optional)
  promoCode: z.string().optional(),
});

type EventRegistrationFormData = z.infer<typeof eventRegistrationSchema>;

interface EventRegistrationFormProps {
  event: SanityEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EventRegistrationForm({ event, isOpen, onClose, onSuccess }: EventRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{
    originalPrice: number;
    finalPrice: number;
    isKingdomBuilder: boolean;
    discountApplied: boolean;
    promoCodeApplied?: string;
    promoCodeDiscount?: number;
  } | null>(null);
  const [promoCodeStatus, setPromoCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  const {
    register,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<EventRegistrationFormData>({
    resolver: zodResolver(eventRegistrationSchema),
    defaultValues: {
      sameAsAttendee: true,
    },
  });

  const sameAsAttendee = watch('sameAsAttendee');
  const attendeeFirstName = watch('attendeeFirstName');
  const attendeeLastName = watch('attendeeLastName');
  const attendeeEmail = watch('attendeeEmail');
  const attendeePhone = watch('attendeePhone');

  // Auto-fill customer info when "same as attendee" is checked
  useEffect(() => {
    if (sameAsAttendee) {
      setValue('customerFirstName', attendeeFirstName || '');
      setValue('customerLastName', attendeeLastName || '');
      setValue('customerEmail', attendeeEmail || '');
      setValue('customerPhone', attendeePhone || '');
    }
  }, [sameAsAttendee, attendeeFirstName, attendeeLastName, attendeeEmail, attendeePhone, setValue]);

  const formatEventDate = (eventSchedule: EventSession[]) => {
    if (!eventSchedule || eventSchedule.length === 0) {
      return 'Date & Time TBD';
    }
    
    const firstSession = eventSchedule[0];
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
    });
    
    const timeStr = `${startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })} - ${endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
    
    return { date: dateStr, time: timeStr };
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Free';
    return `$${price}`;
  };

  const nextStep = async () => {
    if (step === 1) {
      // Validate attendee info
      const attendeeValid = await trigger(['attendeeFirstName', 'attendeeLastName', 'attendeeEmail', 'attendeePhone']);
      if (!attendeeValid) return;
    } else if (step === 2) {
      // Validate customer info
      const customerValid = await trigger([
        'customerFirstName', 'customerLastName', 'customerEmail', 'customerPhone',
        'customerAddress', 'customerCity', 'customerState', 'customerZipCode'
      ]);
      if (!customerValid) return;
      
      // Fetch pricing information
      await fetchPricingInfo();
    }
    
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const validatePromoCode = async () => {
    const promoCode = watch('promoCode');
    if (!promoCode) return;

    setPromoCodeStatus('checking');
    
    try {
      const response = await fetch('/api/events/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.slug.current,
          promoCode: promoCode.toUpperCase(),
        }),
      });

      const data = await response.json();
      
      if (data.valid) {
        setPromoCodeStatus('valid');
        // Calculate discount based on current event price
        const originalPrice = event.price || 0;
        const discountAmount = (originalPrice * data.discountPercent) / 100;
        const finalPrice = Math.max(0, originalPrice - discountAmount);
        
        // Update pricing with promo code discount
        setPricing({
          originalPrice,
          finalPrice,
          isKingdomBuilder: false,
          discountApplied: true,
          promoCodeApplied: promoCode.toUpperCase(),
          promoCodeDiscount: discountAmount,
        });
      } else {
        setPromoCodeStatus('invalid');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeStatus('invalid');
    }
  };

  const fetchPricingInfo = async () => {
    try {
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.slug.current,
          attendeeInfo: {
            firstName: watch('attendeeFirstName'),
            lastName: watch('attendeeLastName'),
            email: watch('attendeeEmail'),
            phone: watch('attendeePhone'),
          },
          customerInfo: {
            firstName: watch('customerFirstName'),
            lastName: watch('customerLastName'),
            email: watch('customerEmail'),
            phone: watch('customerPhone'),
            address: watch('customerAddress'),
            city: watch('customerCity'),
            state: watch('customerState'),
            zipCode: watch('customerZipCode'),
          },
          promoCode: watch('promoCode'),
        }),
      });

      const data = await response.json();
      
      if (data.eventDetails) {
        setPricing({
          originalPrice: data.eventDetails.price || 0,
          finalPrice: data.eventDetails.finalPrice || 0,
          isKingdomBuilder: data.eventDetails.isKingdomBuilder || false,
          discountApplied: data.eventDetails.discountApplied || false,
          promoCodeApplied: data.eventDetails.promoCodeApplied,
          promoCodeDiscount: data.eventDetails.promoCodeDiscount,
        });
      }
    } catch (error) {
      console.error('Error fetching pricing info:', error);
      // Continue without pricing info - will be calculated again during payment
    }
  };

  const handlePaymentSuccess = () => {
    reset();
    setStep(1);
    setPricing(null);
    setPaymentError(null);
    setPromoCodeStatus('idle');
    
    if (onSuccess) {
      onSuccess();
    } else {
      alert('Registration successful! You will receive a confirmation email shortly.');
      onClose();
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  if (!isOpen) return null;

  const eventDateInfo = formatEventDate(event.eventSchedule);

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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 opacity-20 animate-pulse"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1 pr-4">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold font-montserrat leading-tight">
                  Register for Event
                </h2>
                <p className="text-yellow-100 mt-1 sm:mt-2 text-sm sm:text-base leading-tight">
                  {event.title}
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
            {/* Step 1: Event Details & Attendee Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Event Details & Attendee Information</h3>
                
                {/* Event Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-300 opacity-20"></div>
                  <div className="relative z-10">
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
                      <p><strong>Price:</strong> {formatPrice(event.price)}</p>
                      {event.requiresKingdomBuilderDiscount && (
                        <p className="text-purple-600 font-medium">✓ Kingdom Builder discount available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendee Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendee First Name *
                    </label>
                    <input
                      type="text"
                      {...register('attendeeFirstName')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.attendeeFirstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.attendeeFirstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendee Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('attendeeLastName')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.attendeeLastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.attendeeLastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendee Email *
                    </label>
                    <input
                      type="email"
                      {...register('attendeeEmail')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.attendeeEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.attendeeEmail.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendee Phone
                    </label>
                    <input
                      type="tel"
                      {...register('attendeePhone')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.attendeePhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.attendeePhone.message}</p>
                    )}
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promo Code (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...register('promoCode')}
                      placeholder="Enter promo code"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
                      style={{ textTransform: 'uppercase' }}
                    />
                    <button
                      type="button"
                      onClick={() => validatePromoCode()}
                      disabled={promoCodeStatus === 'checking' || !watch('promoCode')}
                      className="px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoCodeStatus === 'checking' ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  
                  {/* Promo Code Status Messages */}
                  {promoCodeStatus === 'valid' && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-800 font-medium">Promo code applied successfully!</span>
                      </div>
                      {pricing?.promoCodeDiscount && (
                        <p className="text-green-700 text-sm mt-1">
                          Discount: ${pricing.promoCodeDiscount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {promoCodeStatus === 'invalid' && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-red-800 font-medium">Invalid promo code</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        Please check the code and try again.
                      </p>
                    </div>
                  )}
                  
                  {errors.promoCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.promoCode.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                >
                  Continue to Billing Information
                </button>
              </motion.div>
            )}

            {/* Step 2: Billing Information */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Billing Information</h3>
                
                {/* Same as Attendee Checkbox */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('sameAsAttendee')}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Billing information is the same as attendee information</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register('customerFirstName')}
                      disabled={sameAsAttendee}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                    />
                    {errors.customerFirstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerFirstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('customerLastName')}
                      disabled={sameAsAttendee}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                    />
                    {errors.customerLastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerLastName.message}</p>
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
                      {...register('customerEmail')}
                      disabled={sameAsAttendee}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                    />
                    {errors.customerEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register('customerPhone')}
                      disabled={sameAsAttendee}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                    />
                    {errors.customerPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    {...register('customerAddress')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {errors.customerAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerAddress.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      {...register('customerCity')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.customerCity && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerCity.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      {...register('customerState')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.customerState && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerState.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      {...register('customerZipCode')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {errors.customerZipCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerZipCode.message}</p>
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
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Complete Registration</h3>
                
                {/* Registration Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-300 opacity-20"></div>
                  <div className="relative z-10">
                    <h4 className="font-semibold text-purple-800 mb-2">Registration Summary</h4>
                    <div className="text-purple-700">
                      <p><strong>Event:</strong> {event.title}</p>
                      <p><strong>Attendee:</strong> {watch('attendeeFirstName')} {watch('attendeeLastName')}</p>
                      <p><strong>Email:</strong> {watch('attendeeEmail')}</p>
                      {pricing && (
                        <>
                          {pricing.discountApplied ? (
                            <>
                              <p><strong>Original Price:</strong> <span className="line-through">${pricing.originalPrice}</span></p>
                              <p><strong>Final Price:</strong> ${pricing.finalPrice}</p>
                              {pricing.promoCodeApplied ? (
                                <p className="text-green-600 font-medium">✓ Promo code {pricing.promoCodeApplied} applied! (${pricing.promoCodeDiscount?.toFixed(2)} off)</p>
                              ) : pricing.isKingdomBuilder ? (
                                <p className="text-green-600 font-medium">✓ 50% Kingdom Builder discount applied!</p>
                              ) : (
                                <p className="text-green-600 font-medium">✓ Discount applied!</p>
                              )}
                            </>
                          ) : (
                            <p><strong>Price:</strong> ${pricing.finalPrice || 0}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Error */}
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
                
                {/* Custom Stripe Payment Form for Events */}
                <StripePaymentForm
                  amount={pricing?.finalPrice || event.price || 0}
                  donationType="event_registration"
                  customerInfo={{
                    firstName: watch('customerFirstName'),
                    lastName: watch('customerLastName'),
                    email: watch('customerEmail'),
                    phone: watch('customerPhone'),
                    address: watch('customerAddress'),
                    city: watch('customerCity'),
                    state: watch('customerState'),
                    zipCode: watch('customerZipCode'),
                  }}
                  motivationMessage={`Event registration: ${event.slug.current}`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  eventRegistrationData={{
                    eventId: event.slug.current,
                    attendeeInfo: {
                      firstName: watch('attendeeFirstName'),
                      lastName: watch('attendeeLastName'),
                      email: watch('attendeeEmail'),
                      phone: watch('attendeePhone') || '',
                    },
                    promoCode: watch('promoCode'),
                  }}
                />

                <button
                  type="button"
                  onClick={prevStep}
                  className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg hover:border-gray-400 transition-all duration-300 mt-6"
                >
                  Back to Billing Information
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
