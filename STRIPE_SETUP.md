# 605 Wells Kingdom Builder Setup Guide

## 🚀 Quick Start

Your Kingdom Builder donation system is ready! Follow these steps to configure Stripe and Mailchimp integrations.

## 📋 Environment Variables Setup

1. **Create your environment file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your credentials to `.env.local`**:

### 🔐 Stripe Configuration

1. **Get Stripe Keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to **Developers > API Keys**
   - Copy your **Publishable key** and **Secret key**

2. **Add to `.env.local`**:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   STRIPE_SECRET_KEY=sk_test_your_actual_key_here
   ```

### 📧 Mailchimp Configuration

1. **Get Mailchimp API Key**:
   - Go to [Mailchimp Dashboard](https://mailchimp.com)
   - Navigate to **Account > Extras > API Keys**
   - Generate a new API key

2. **Get Audience ID**:
   - Go to **Audience > Settings > Audience name and defaults**
   - Copy the **Audience ID**

3. **Find Server Prefix**:
   - Look at your API key - it ends with something like `-us1` or `-us12`
   - That's your server prefix

4. **Add to `.env.local`**:
   ```bash
   MAILCHIMP_API_KEY=your_actual_api_key_here
   MAILCHIMP_AUDIENCE_ID=your_actual_audience_id_here
   MAILCHIMP_SERVER_PREFIX=us1
   ```

## 🎯 Features Included

### ✅ **Donation Form**
- **Multi-step form** with progress indicator
- **Donation types**: One-time, Monthly, Custom amounts
- **Pre-set amounts**: $25, $50, $100, $250, $500, $1,000
- **Custom amount** option with validation
- **Personal information** collection
- **Optional motivation message**

### ✅ **Payment Processing**
- **Stripe integration** for secure payments
- **Monthly subscriptions** for recurring donations
- **One-time payments** for single donations
- **Automatic email receipts**
- **Mobile-optimized** payment forms

### ✅ **Email Integration**
- **Mailchimp subscription** for Kingdom Builders
- **Automatic tagging** based on donation type
- **Donor segmentation** for targeted communications
- **Address collection** for complete donor profiles

### ✅ **User Experience**
- **Mobile-first design** with touch-friendly interface
- **Smooth animations** using Framer Motion
- **Form validation** with real-time feedback
- **Error handling** with user-friendly messages
- **Success notifications** and form reset

## 🛠️ Testing Your Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the donation flow**:
   - Click "Become a Kingdom Builder"
   - Fill out the form with test data
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date and 3-digit CVC

3. **Verify integrations**:
   - Check Stripe Dashboard for test payments
   - Check Mailchimp for new subscribers
   - Verify email receipts are sent

## 📱 Mobile Optimization

The entire experience is optimized for mobile users:
- **Touch-friendly buttons** with proper sizing
- **Responsive typography** that scales across devices
- **Mobile-first layout** that works on all screen sizes
- **Fast loading** with optimized images and code splitting

## 🔒 Security Features

- **PCI-compliant** payment processing through Stripe
- **Secure card data** handling (never touches your server)
- **Encrypted communication** for all sensitive data
- **Input validation** to prevent malicious submissions

## 🎨 Customization

### Donation Amounts
Edit `src/components/KingdomBuilderForm.tsx` to modify preset amounts:
```typescript
const donationAmounts = [
  { value: 25, label: '$25' },
  { value: 50, label: '$50' },
  // Add or modify amounts here
];
```

### Styling
- All components use Tailwind CSS
- Colors follow the 605 Wells brand (yellow/orange gradients)
- Montserrat font for headings, Inter for body text

## 🚀 Going Live

When ready for production:

1. **Switch to Live Stripe Keys**:
   - Replace `pk_test_` with `pk_live_`
   - Replace `sk_test_` with `sk_live_`

2. **Update Base URL**:
   ```bash
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   ```

3. **Test everything** with small real donations first!

## 📞 Support

If you need help:
- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Mailchimp Documentation**: [mailchimp.com/developer](https://mailchimp.com/developer)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

---

## 🎉 You're Ready!

Your Kingdom Builder donation system is now fully functional with:
- ✅ Secure payment processing
- ✅ Email list management  
- ✅ Mobile-optimized experience
- ✅ Professional design matching 605 Wells branding

**May God bless this tool in building His Kingdom!** 🙏 