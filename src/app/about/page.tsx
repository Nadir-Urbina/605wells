'use client';

import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useState } from "react";

export default function About() {
  const [, setIsFormOpen] = useState(false);
  
  const openKingdomBuilderForm = () => setIsFormOpen(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header onDonateClick={openKingdomBuilderForm} />

      {/* Main Content */}
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-8 font-montserrat">
              About 605 Wells
            </h1>
            
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-gray-200">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 font-montserrat">
                  Coming Soon
                </h2>
                
                <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                  We&apos;re crafting something beautiful to share the heart and vision behind 605 Wells. 
                  This transformational gathering place will soon reveal its full story of Kingdom impact, 
                  healing, and community transformation.
                </p>
                
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <motion.button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white font-bold rounded-lg hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Return Home
                  </motion.button>
                  
                  <motion.button
                    onClick={openKingdomBuilderForm}
                    className="px-8 py-3 border-2 border-purple-600 text-purple-600 font-bold rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Become a Kingdom Builder
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 