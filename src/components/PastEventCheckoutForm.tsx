'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { SanityPastEvent } from '@/lib/sanity'
import { getStripe } from '@/lib/stripe'

interface PastEventCheckoutFormProps {
  event: SanityPastEvent
}

function CheckoutForm({ event }: PastEventCheckoutFormProps) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    try {
      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error('Please fill in all required fields')
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      // If free, register directly
      if (event.price === 0) {
        const response = await fetch('/api/past-events/register-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pastEventId: event.slug.current,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed')
        }

        // Redirect to watch page with token
        router.push(`/past-events/${event.slug.current}/watch?token=${data.accessToken}`)
        return
      }

      // For paid events, use Stripe Elements
      if (!stripe || !elements) {
        throw new Error('Stripe has not loaded yet. Please try again.')
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found.')
      }

      // Create payment intent
      const response = await fetch('/api/past-events/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pastEventId: event.slug.current,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      // Confirm the payment
      const { clientSecret } = data
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
          },
        },
      })

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || 'Payment failed')
      }

      if (paymentResult.paymentIntent && paymentResult.paymentIntent.status === 'succeeded') {
        // Payment succeeded - webhook will handle token creation and email
        console.log('✅ Payment succeeded - email will be sent via webhook')

        // Redirect to success page
        router.push(`/past-events/${event.slug.current}/success?session_id=${paymentResult.paymentIntent.id}`)
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
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
    hidePostalCode: false,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
          First Name *
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          required
          disabled={isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
          Last Name *
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          required
          disabled={isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Access link will be sent to this email
        </p>
      </div>

      {event.price > 0 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Information
            </label>
            <div className="p-4 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-blue-800 text-sm font-medium">
                Your payment information is secure and encrypted.
              </span>
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isProcessing || (event.price > 0 && !stripe)}
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : event.price === 0 ? (
          'Get Free Access'
        ) : (
          `Purchase Access - $${event.price.toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By purchasing, you agree to our terms of service and privacy policy
      </p>
    </form>
  )
}

export default function PastEventCheckoutForm(props: PastEventCheckoutFormProps) {
  const stripePromise = getStripe()

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
