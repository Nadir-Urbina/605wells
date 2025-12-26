import { Metadata } from 'next';
import VolunteerSignUpForm from '@/components/VolunteerSignUpForm';

export const metadata: Metadata = {
  title: 'Volunteer Sign-Up | 605 Wells',
  description: 'Join our ministry team and make a difference in the Kingdom. Sign up to volunteer with 605 Wells.',
};

export default function VolunteerPage() {
  return <VolunteerSignUpForm />;
}
