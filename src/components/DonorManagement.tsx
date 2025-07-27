'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        unit_amount: number;
        recurring: {
          interval: string;
        };
      };
    }>;
  };
  customer: {
    email: string;
    name: string;
  };
}

interface DonorManagementProps {
  customerEmail: string;
  onClose: () => void;
}

export default function DonorManagement({ customerEmail, onClose }: DonorManagementProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const amounts = [
    { value: 60, label: '$60/month' },
    { value: 120, label: '$120/month', featured: true },
    { value: 180, label: '$180/month' },
    { value: 240, label: '$240/month' },
  ];

  useEffect(() => {
    fetchSubscription();
  }, [customerEmail]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/get-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        if (data.subscription) {
          setSelectedAmount(data.subscription.items.data[0].price.unit_amount / 100);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (newAmount: number) => {
    if (!subscription) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/update-subscription-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          newAmount: newAmount,
        }),
      });

      if (response.ok) {
        await fetchSubscription(); // Refresh subscription data
        alert('Subscription updated successfully!');
      } else {
        alert('Failed to update subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const pauseSubscription = async () => {
    if (!subscription) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/pause-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (response.ok) {
        await fetchSubscription();
        alert('Subscription paused successfully.');
      } else {
        alert('Failed to pause subscription.');
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
    } finally {
      setUpdating(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;
    
    if (!confirm('Are you sure you want to cancel your Kingdom Builder subscription? You will lose your benefits.')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (response.ok) {
        alert('Subscription cancelled successfully.');
        onClose();
      } else {
        alert('Failed to cancel subscription.');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
            Loading your subscription...
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold font-montserrat">Manage Your Support</h2>
              <p className="text-purple-100 mt-1">Kingdom Builder Dashboard</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {subscription ? (
            <div className="space-y-6">
              {/* Current Subscription Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Active Kingdom Builder</h3>
                <div className="text-green-700">
                  <p>Current Amount: <span className="font-bold">${subscription.items.data[0].price.unit_amount / 100}/month</span></p>
                  <p>Status: <span className="font-bold capitalize">{subscription.status}</span></p>
                  <p>Next Payment: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Kingdom Builder Benefits */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Your Kingdom Builder Benefits</h4>
                <ul className="text-purple-700 text-sm space-y-1">
                  <li>✓ 50% off all registration fees within 605 Wells</li>
                  <li>✓ Waived application fees for trips</li>
                  <li>✓ Waived admission fee into Kingdom Champions College</li>
                </ul>
              </div>

              {/* Update Donation Amount */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Monthly Amount</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {amounts.map((amount) => (
                    <button
                      key={amount.value}
                      onClick={() => setSelectedAmount(amount.value)}
                      disabled={updating}
                      className={`p-4 text-center border-2 rounded-lg transition-all font-semibold relative ${
                        selectedAmount === amount.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {amount.featured && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-bold">
                          GOAL
                        </div>
                      )}
                      <div>{amount.label}</div>
                    </button>
                  ))}
                </div>

                {selectedAmount !== (subscription.items.data[0].price.unit_amount / 100) && (
                  <button
                    onClick={() => updateSubscription(selectedAmount!)}
                    disabled={updating}
                    className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : `Update to $${selectedAmount}/month`}
                  </button>
                )}
              </div>

              {/* Management Actions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h3>
                <div className="space-y-3">
                  <button
                    onClick={pauseSubscription}
                    disabled={updating}
                    className="w-full border-2 border-yellow-500 text-yellow-700 font-semibold py-3 px-6 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : 'Pause Subscription'}
                  </button>
                  
                  <button
                    onClick={cancelSubscription}
                    disabled={updating}
                    className="w-full border-2 border-red-500 text-red-700 font-semibold py-3 px-6 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t find an active Kingdom Builder subscription for {customerEmail}.
              </p>
              <button
                onClick={onClose}
                className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Start Your Kingdom Builder Journey
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 