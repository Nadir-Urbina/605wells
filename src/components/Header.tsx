'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from '@vercel/analytics';

interface HeaderProps {
  onDonateClick: () => void;
}

export default function Header({ onDonateClick }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (sectionId: string) => {
    // Close mobile menu
    setIsMobileMenuOpen(false);
    
    // Navigate to the page or scroll to home section
    if (sectionId === 'home') {
      window.location.href = '/';
    } else {
      window.location.href = `/${sectionId}`;
    }
  };

  const handleDonateClick = () => {
    // Track donate button click
    track('Donate Button Clicked', { location: 'header' });
    setIsMobileMenuOpen(false);
    onDonateClick();
  };

  const navItems = [
    { name: 'About', id: 'about' },
    { name: 'Events', id: 'events' },
    { name: 'News', id: 'news' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="text-2xl sm:text-3xl font-bold font-montserrat text-white hover:text-yellow-400 transition-colors duration-300"
            >
              605 Wells
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-gray-300 hover:text-purple-400 font-medium transition-colors duration-300 relative group"
              >
                {item.name}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
            ))}
            
            {/* Desktop Donate Button */}
            <motion.button
              onClick={handleDonateClick}
              className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Donate
            </motion.button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-purple-400 focus:outline-none focus:text-purple-400 transition-colors duration-300"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
                         className="md:hidden bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-lg"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="block w-full text-left px-4 py-3 text-gray-300 hover:text-purple-400 hover:bg-gray-800 rounded-lg font-medium transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {item.name}
                </motion.button>
              ))}
              
              {/* Mobile Donate Button */}
              <motion.button
                onClick={handleDonateClick}
                className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 transition-all duration-300 shadow-lg mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: navItems.length * 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                Donate Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 