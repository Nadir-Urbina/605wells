import { Metadata } from 'next';
import VolunteerSignUpForm from '@/components/VolunteerSignUpForm';

export const metadata: Metadata = {
  title: 'Volunteer Sign-Up | East Gate Revival Hub',
  description: 'Join our ministry team and make a difference in the Kingdom. Sign up to volunteer with East Gate Revival Hub.',
};

export default function VolunteerPage() {
  return <VolunteerSignUpForm />;
}
