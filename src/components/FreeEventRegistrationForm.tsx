'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type SanityEvent } from '@/lib/sanity';

// Form validation schema for free registration
const freeRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
});

type FreeRegistrationFormData = z.infer<typeof freeRegistrationSchema>;

interface FreeEventRegistrationFormProps {
  event: SanityEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FreeEventRegistrationForm({ 
  event, 
  isOpen, 
  onClose, 
  onSuccess 
}: FreeEventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FreeRegistrationFormData>({
    resolver: zodResolver(freeRegistrationSchema),
  });

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

  const onSubmit = async (data: FreeRegistrationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/events/register-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.slug.current,
          attendeeInfo: data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Show success state
      setIsSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 3000);

    } catch (error) {
      console.error('Free registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError(null);
    setIsSuccess(false);
    setIsSubmitting(false);
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
          className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
                  Free Event Registration
                </h2>
                <p className="text-purple-100 mt-1 text-sm sm:text-base leading-tight">
                  {event.title}
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
                  A confirmation email has been sent to your email address.
                </p>
                <p className="text-sm text-gray-500">
                  This window will close automatically...
                </p>
              </motion.div>
            ) : (
              /* Registration Form */
              <>
                {/* Event Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-300 opacity-20"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-800">{event.title}</h4>
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        FREE
                      </span>
                    </div>
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
                      {event.registrationLimit && (
                        <p className="text-purple-600 font-medium">
                          ⚠️ Limited to {event.registrationLimit} attendees
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                  
                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </div>
                    ) : (
                      'Complete Free Registration'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By registering, you agree to receive event updates and confirmations via email.
                  </p>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
