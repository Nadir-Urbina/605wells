import { client } from '@/lib/sanity';
import { notFound } from 'next/navigation';
import SessionRequestFlow from '@/components/virtual-hub/SessionRequestFlow';

interface MinistryType {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  icon?: {
    asset: {
      url: string;
    };
  };
  averageDuration: number;
  costType: 'free' | 'paid' | 'both';
  price?: number;
  intakeFormQuestions?: Array<{
    question: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>;
}

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: {
    asset: {
      url: string;
    };
  };
  bio?: string;
  role: 'staff' | 'volunteer';
}

async function getMinistryType(slug: string): Promise<MinistryType | null> {
  const query = `*[_type == "ministryType" && slug.current == $slug && active == true][0] {
    _id,
    title,
    slug,
    description,
    icon {
      asset-> {
        url
      }
    },
    averageDuration,
    costType,
    price,
    intakeFormQuestions
  }`;

  return client.fetch(query, { slug });
}

async function getTeamMembers(ministryTypeId: string): Promise<TeamMember[]> {
  const query = `*[_type == "teamMember" && active == true && $ministryTypeId in ministryTypes[]->_id] {
    _id,
    firstName,
    lastName,
    email,
    avatar {
      asset-> {
        url
      }
    },
    bio,
    role
  } | order(firstName asc)`;

  return client.fetch(query, { ministryTypeId });
}

export default async function MinistryRequestPage({
  params,
}: {
  params: Promise<{ ministryTypeSlug: string }>;
}) {
  const { ministryTypeSlug } = await params;
  const ministryType = await getMinistryType(ministryTypeSlug);

  if (!ministryType) {
    notFound();
  }

  const teamMembers = await getTeamMembers(ministryType._id);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/virtual-hub"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Virtual Hub
          </a>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {ministryType.title}
          </h1>
          <p className="text-lg text-gray-600 mt-2">{ministryType.description}</p>
          <div className="flex items-center mt-4 text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Average session: {ministryType.averageDuration} minutes
          </div>
        </div>

        {/* Session Request Flow Component */}
        <SessionRequestFlow
          ministryType={ministryType}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
}
