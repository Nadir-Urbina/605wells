'use client';

import { motion } from 'framer-motion';
import { track } from '@vercel/analytics';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { client } from '@/lib/sanity';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface MinistryCategory {
  _id: string;
  name: string;
  order: number;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  ministryRequested: string;
  salvationExperience: string;
  localChurch: string;
  baptizedInHolySpirit: string;
  reasonForMinistry: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  ministryRequested?: string;
  salvationExperience?: string;
  localChurch?: string;
  baptizedInHolySpirit?: string;
  reasonForMinistry?: string;
}

export default function MinistrySessionRequest() {
  const [, setIsFormOpen] = useState(false);
  const [ministryCategories, setMinistryCategories] = useState<MinistryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    ministryRequested: '',
    salvationExperience: '',
    localChurch: '',
    baptizedInHolySpirit: '',
    reasonForMinistry: '',
  });

  const openKingdomBuilderForm = () => {
    track('Kingdom Builder Form Opened', { location: 'ministry-session-request' });
    setIsFormOpen(true);
  };

  // Fetch ministry categories from Sanity
  useEffect(() => {
    async function fetchMinistryCategories() {
      try {
        const categories = await client.fetch<MinistryCategory[]>(
          `*[_type == "ministryCategory" && active == true] | order(order asc) {
            _id,
            name,
            order
          }`
        );
        setMinistryCategories(categories);
      } catch (error) {
        console.error('Error fetching ministry categories:', error);
      }
    }

    fetchMinistryCategories();
  }, []);

  // Load reCAPTCHA script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.addEventListener('load', () => setRecaptchaLoaded(true));
    document.body.appendChild(script);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (US format)
    const phoneRegex = /^[\d\s\-\(\)\+\.]{10,}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid US phone number';
    }

    // Ministry Requested validation
    if (!formData.ministryRequested) {
      newErrors.ministryRequested = 'Please select a ministry';
    }

    // Salvation Experience validation
    if (!formData.salvationExperience.trim()) {
      newErrors.salvationExperience = 'Please share your salvation experience';
    }

    // Local Church validation
    if (!formData.localChurch.trim()) {
      newErrors.localChurch = 'Local church is required';
    }

    // Baptized in Holy Spirit validation
    if (!formData.baptizedInHolySpirit) {
      newErrors.baptizedInHolySpirit = 'Please select an option';
    }

    // Reason for Ministry validation
    if (!formData.reasonForMinistry.trim()) {
      newErrors.reasonForMinistry = 'Please share why you need this ministry time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get reCAPTCHA token
      if (!recaptchaLoaded) {
        throw new Error('reCAPTCHA not loaded yet. Please try again.');
      }

      const recaptchaToken = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        { action: 'ministry_request' }
      );

      const response = await fetch('/api/ministry-session-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
          honeypot: '', // Empty honeypot field
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      // Track successful submission
      track('Ministry Session Request Submitted', {
        ministry: formData.ministryRequested,
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to submit request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onDonateClick={openKingdomBuilderForm} />
        <div className="pt-20 min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-2xl w-full text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-montserrat">
              Request Received!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your ministry session request. Our ministry team will review your
              request and contact you within next few days
            </p>
            <p className="text-md text-gray-500 mb-8">
              Please check your email for a confirmation message with more details.
            </p>
            <motion.button
              onClick={() => (window.location.href = '/')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 transition-all duration-300 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Return Home
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onDonateClick={openKingdomBuilderForm} />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 font-montserrat text-center pt-8">
              Ministry Session Request
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">
              We&apos;re here to support you in your wholeness journey. Complete this form to
              request a ministry session with our team.
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                {/* Ministry Requested */}
                <div>
                  <label
                    htmlFor="ministryRequested"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Ministry Requested <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ministryRequested"
                    name="ministryRequested"
                    value={formData.ministryRequested}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.ministryRequested ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all`}
                  >
                    <option value="">Select a ministry...</option>
                    {ministryCategories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.ministryRequested && (
                    <p className="mt-1 text-sm text-red-500">{errors.ministryRequested}</p>
                  )}
                </div>

                {/* How was your salvation experience */}
                <div>
                  <label
                    htmlFor="salvationExperience"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    How was your salvation experience <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="salvationExperience"
                    name="salvationExperience"
                    value={formData.salvationExperience}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border ${
                      errors.salvationExperience ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none`}
                    placeholder="Share your salvation experience..."
                  />
                  {errors.salvationExperience && (
                    <p className="mt-1 text-sm text-red-500">{errors.salvationExperience}</p>
                  )}
                </div>

                {/* Local Church */}
                <div>
                  <label htmlFor="localChurch" className="block text-sm font-semibold text-gray-700 mb-2">
                    Local Church <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="localChurch"
                    name="localChurch"
                    value={formData.localChurch}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.localChurch ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all`}
                    placeholder="Name of your local church"
                  />
                  {errors.localChurch && (
                    <p className="mt-1 text-sm text-red-500">{errors.localChurch}</p>
                  )}
                </div>

                {/* Have you been baptized in the Holy Spirit */}
                <div>
                  <label
                    htmlFor="baptizedInHolySpirit"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Have you been baptized in the Holy Spirit <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="baptizedInHolySpirit"
                    name="baptizedInHolySpirit"
                    value={formData.baptizedInHolySpirit}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${
                      errors.baptizedInHolySpirit ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all`}
                  >
                    <option value="">Select an option...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {errors.baptizedInHolySpirit && (
                    <p className="mt-1 text-sm text-red-500">{errors.baptizedInHolySpirit}</p>
                  )}
                </div>

                {/* Why do you feel you need this ministry time */}
                <div>
                  <label
                    htmlFor="reasonForMinistry"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Why do you feel you need this ministry time? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reasonForMinistry"
                    name="reasonForMinistry"
                    value={formData.reasonForMinistry}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border ${
                      errors.reasonForMinistry ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none`}
                    placeholder="Share why you need this ministry time..."
                  />
                  {errors.reasonForMinistry && (
                    <p className="mt-1 text-sm text-red-500">{errors.reasonForMinistry}</p>
                  )}
                </div>

                {/* Honeypot field - hidden from users */}
                <input
                  type="text"
                  name="honeypot"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg ${
                      isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:from-purple-700 hover:via-blue-700 hover:to-purple-800'
                    }`}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </motion.button>
                </div>

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  This form is protected by reCAPTCHA. Your information will be kept confidential
                  and used only to schedule your ministry session.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
