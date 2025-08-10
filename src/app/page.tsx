'use client';

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { track } from '@vercel/analytics';
import TypingEffect from "@/components/TypingEffect";
import KingdomBuilderForm from "@/components/KingdomBuilderForm";
import Header from "@/components/Header";
import EventsSection from "@/components/EventsSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successDonationType, setSuccessDonationType] = useState<'monthly' | 'one-time'>('monthly');
  
  const ministryActivities = [
    "Discipling",
    "Deliverance and Inner Healing", 
    "Equipping of the Saints",
    "Regional Kingdom Impact",
    "Healing Streams",
    "Old Way Fellowship",
    "Prayer and Intercession",
    "Kingdom Champions College",
    "Apostolic Family Gathering",
    "East Gate Jax"
  ];

  const openKingdomBuilderForm = () => {
    // Track Kingdom Builder button click
    track('Kingdom Builder Form Opened', { location: 'hero' });
    setIsFormOpen(true);
  };
  const closeKingdomBuilderForm = () => setIsFormOpen(false);
  
  const handlePaymentSuccess = (donationType: 'monthly' | 'one-time' = 'monthly') => {
    setIsFormOpen(false);
    setSuccessDonationType(donationType);
    setShowSuccessMessage(true);
    
    // Auto close after 10 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 10000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header onDonateClick={openKingdomBuilderForm} />

      {/* Hero Section */}
      <div id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/heroImg.JPG"
            alt="605 Wells Building"
            fill
            className="object-cover"
            priority
            quality={100}
            sizes="100vw"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto pt-16 sm:pt-20">
          {/* Main heading with animation */}
          <motion.div 
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 font-montserrat tracking-tight drop-shadow-2xl"
                style={{
                  textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6), 2px 2px 4px rgba(0,0,0,0.9)'
                }}>
              605 Wells
            </h1>
          </motion.div>

          {/* Love, Live, Labor, Lead - Prominent Display */}
          <motion.div 
            className="mb-8 sm:mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.0 }}
          >
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 max-w-6xl mx-auto">
              {["LOVE", "LIVE", "LABOR", "LEAD"].map((word, index) => (
                <motion.div
                  key={word}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 + index * 0.1 }}
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white font-montserrat tracking-wider drop-shadow-2xl"
                      style={{
                        textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6), 2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                    {word}
                  </h2>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Typing effect section with enhanced styling */}
          <motion.div 
            className="mt-6 sm:mt-8 bg-black/50 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 border border-white/30 shadow-2xl max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.6 }}
          >
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 font-medium">
              What&apos;s happening at 605 Wells Rd:
            </p>
            
            {/* Typing effect container with fixed height */}
            <div className="min-h-[50px] sm:min-h-[60px] md:min-h-[80px] flex items-center justify-center mb-6 sm:mb-8">
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-center">
                <TypingEffect 
                  phrases={ministryActivities}
                  interval={2000}
                  typingSpeed={60}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600"
                />
              </div>
            </div>
            
            <motion.p 
              className="text-gray-300 text-base sm:text-lg md:text-xl max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.0 }}
            >
              A Transformational Gathering Place
            </motion.p>
            <motion.p 
              className="text-gray-300 text-base sm:text-lg md:text-xl max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.1 }}
            >
              Where the Waters Run Deep • Where People Are Healed, Built, and Sent
            </motion.p>
            
            {/* Call to action buttons */}
            <motion.div 
              className="flex flex-col gap-4 sm:gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 2.2 }}
            >
              <motion.button 
                onClick={openKingdomBuilderForm}
                className="w-full max-w-xs bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg text-base sm:text-lg shadow-xl hover:shadow-2xl hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 transition-all duration-300 touch-manipulation"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Become a Kingdom Builder
              </motion.button>
              <motion.button 
                className="w-full max-w-xs relative overflow-hidden border-2 border-purple-400 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg text-base sm:text-lg hover:border-blue-400 transition-all duration-300 touch-manipulation backdrop-blur-sm group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-blue-600/0 to-purple-600/0 group-hover:from-purple-600/20 group-hover:via-blue-600/20 group-hover:to-purple-600/20 transition-all duration-300"></div>
                <span className="relative z-10">Learn More About Our Vision</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Scripture references */}
          <motion.div 
            className="mt-8 sm:mt-12 text-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.4 }}
          >
            <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-2">
              <span className="font-semibold text-yellow-400">Psalm 60:5</span> • <span className="font-semibold text-yellow-400">Isaiah 60:5</span>
            </p>
            <p className="text-gray-400 text-xs sm:text-sm md:text-base italic">
              &quot;That Your beloved may be delivered&quot; • &quot;Then you shall see and become radiant&quot;
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-white"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>

      {/* Mission section */}
      <section id="about" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 font-montserrat">
              The Kingdom Hub
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
              605 Wells isn&apos;t a Sunday-centric church building. It is a <strong className="text-orange-600">Kingdom Hub</strong>, 
              a place where the people of God are not just gathered but grown. They&apos;re not just healed, 
              they&apos;re handed the keys to lead.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {[
              {
                title: "It Heals",
                description: "Inner healing and deliverance for real life change. Not hype. Actual healing that sticks.",
                icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                gradient: "from-blue-500 to-purple-600"
              },
              {
                title: "It Builds",
                description: "Raising up unshakable leaders, saturated in Word and Spirit, ready to disciple nations.",
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                gradient: "from-green-500 to-teal-600"
              },
              {
                title: "It Sends",
                description: "A launchpad for people who know how to walk with God and transform their communities.",
                icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
                gradient: "from-orange-500 to-red-600"
              }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className={`bg-gradient-to-br ${item.gradient} w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{item.title}</h3>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-605-wells" className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-montserrat">
              About 605 Wells
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content - 8 columns */}
            <motion.div
              className="lg:col-span-8 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="prose prose-lg prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-gray-200 mb-5">
                  605 Wells is more than a building. It is a <strong className="text-yellow-400">Kingdom gathering place</strong> where transformation begins with people and overflows into places.
                </p>
                
                <p className="text-lg leading-relaxed text-gray-200 mb-5">
                  Right in the heart of Orange Park, Florida, 605 Wells stands as a <strong className="text-blue-300">regional apostolic hub</strong>. This space is built to disciple, develop, and deploy leaders into every sphere of culture.
                </p>

                <p className="text-lg leading-relaxed text-gray-200 mb-6">
                  The name 605 Wells carries both a physical location and a <strong className="text-purple-300">prophetic assignment</strong>. Psalm 60:5 and Isaiah 60:5 come together here, marking this place as a well of love and restoration.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <p className="text-lg font-semibold text-yellow-300 text-center">
                  What God starts here will touch cities, regions, and nations.
                </p>
              </div>

              {/* More Than a Building */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg p-5 border border-yellow-400/30">
                <h3 className="text-xl font-bold mb-4 text-yellow-300 text-center">More Than a Building</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    "Basecamp for Kingdom exploits",
                    "Place of presence", 
                    "House of prayer",
                    "Launching pad for leaders",
                    "Family table",
                    "Place of strategy",
                    "Center of worship",
                    "Hub of commissioning"
                  ].map((descriptor, index) => (
                    <div key={descriptor} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-gray-200 text-sm">{descriptor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sidebar - 4 columns */}
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 h-fit sticky top-8">
                <h3 className="text-xl font-bold mb-5 text-yellow-400 text-center">Active Six Days a Week</h3>
                <div className="space-y-3">
                  {[
                    "Healing Streams Encounter",
                    "East Gate Jacksonville", 
                    "Kingdom Champions College",
                    "House of Prayer for All Nations",
                    "La Cresta de la Ola",
                    "Old Way Fellowship"
                  ].map((ministry, index) => (
                    <motion.div 
                      key={ministry} 
                      className="flex items-start space-x-3 group"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0 group-hover:bg-yellow-400 transition-colors"></div>
                      <span className="text-gray-200 text-sm leading-relaxed">{ministry}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="border-t border-white/20 mt-5 pt-4">
                  <p className="text-xs text-gray-300 italic text-center leading-relaxed">
                    Each expression carries a part of the Kingdom, forming a whole family of impact.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Closing Statement */}
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30 max-w-4xl mx-auto">
              <h3 className="text-2xl lg:text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 font-montserrat">
                This is 605 Wells
              </h3>
              <p className="text-xl lg:text-2xl text-gray-200 font-medium">
                Where love lives and leaders are launched.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <EventsSection />

      {/* Success Message Modal */}
      <motion.div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 ${showSuccessMessage ? 'block' : 'hidden'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: showSuccessMessage ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-white rounded-2xl max-w-md w-full p-8 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: showSuccessMessage ? 1 : 0.8, opacity: showSuccessMessage ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
                         <h3 className="text-2xl font-bold text-gray-900 mb-2 font-montserrat">
                 {successDonationType === 'monthly' ? 'Welcome, Kingdom Builder!' : 'Thank You for Your Generous Gift!'}
               </h3>

               <p className="text-gray-600 mb-4">
                 {successDonationType === 'monthly' 
                   ? "Thank you for joining our mission! You'll receive a confirmation email shortly with your Kingdom Builder benefits."
                   : "Thank you for your generous heart and for sowing into God's Kingdom work at 605 Wells! You'll receive a confirmation email shortly."
                 }
               </p>

               <div className={`border rounded-lg p-3 mb-4 ${
                 successDonationType === 'monthly' 
                   ? 'bg-purple-50 border-purple-200' 
                   : 'bg-green-50 border-green-200'
               }`}>
                 <p className={`text-sm font-medium ${
                   successDonationType === 'monthly' ? 'text-purple-700' : 'text-green-700'
                 }`}>
                   {successDonationType === 'monthly' 
                     ? '🎉 Monthly support activated • Full benefits unlocked'
                     : '🙏 Your gift makes a difference • Consider joining our Kingdom Builders'
                   }
                 </p>
               </div>
          
          <div className="text-xs text-gray-500">
            This window will close automatically...
          </div>
        </motion.div>
      </motion.div>

      {/* Kingdom Builder Form Modal */}
      <KingdomBuilderForm isOpen={isFormOpen} onClose={closeKingdomBuilderForm} onPaymentSuccess={handlePaymentSuccess} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
