'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Footer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      {/* Main Footer Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand & Contact Info */}
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold mb-4 font-montserrat">605 Wells</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                A Transformational Gathering Place where people are healed, built, and sent.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-300">605 Wells Road, Jacksonville, FL</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:admin@eastgatejax.com" className="text-purple-300 hover:text-purple-200 transition-colors duration-300">
                    admin@eastgatejax.com
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link href="/#home" className="hover:text-purple-300 transition-colors duration-300">Home</Link></li>
                <li><Link href="/#about" className="hover:text-purple-300 transition-colors duration-300">About</Link></li>
                <li><Link href="/events" className="hover:text-purple-300 transition-colors duration-300">Events</Link></li>
                <li><Link href="/news" className="hover:text-purple-300 transition-colors duration-300">News</Link></li>
                <li><Link href="/contact" className="hover:text-purple-300 transition-colors duration-300">Contact</Link></li>
              </ul>
            </div>

            {/* Ministry Areas */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Ministry</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Discipling</li>
                <li>Deliverance & Inner Healing</li>
                <li>Equipping of the Saints</li>
                <li>Regional Kingdom Impact</li>
                <li>Prayer & Intercession</li>
                <li>Kingdom Champions College</li>
              </ul>
            </div>

            {/* Contact Form */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Send Message</h4>
              
              {submitStatus === 'success' && (
                <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-green-300">Message Sent!</p>
                      <p className="text-xs text-green-400">We&apos;ll get back to you soon!</p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-red-300">Error</p>
                      <p className="text-xs text-red-400">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 text-white text-sm"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 text-white text-sm"
                    placeholder="Email"
                  />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 text-white text-sm"
                  placeholder="Phone (Optional)"
                />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 text-white resize-vertical text-sm"
                  placeholder="Your message..."
                />
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex space-x-4 text-sm text-purple-300 font-semibold">
                <span>LOVE</span>
                <span>LIVE</span>
                <span>LABOR</span>
                <span>LEAD</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">
                  © {new Date().getFullYear()} 605 Wells. All rights reserved.
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-yellow-400">Psalm 60:5</span> • 
                  <span className="font-semibold text-yellow-400"> Isaiah 60:5</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
} 