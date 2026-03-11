import { client } from '@/lib/sanity';
import Image from 'next/image';
import Link from 'next/link';

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
  order: number;
}

async function getMinistryTypes(): Promise<MinistryType[]> {
  const query = `*[_type == "ministryType" && active == true] | order(order asc) {
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
    order
  }`;

  return client.fetch(query);
}

export default async function VirtualHubPage() {
  const ministryTypes = await getMinistryTypes();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Virtual Hub
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              Request a ministry session with our team of experienced staff and volunteers
            </p>
            <a
              href="#ministry-types"
              className="inline-block bg-white text-purple-600 font-semibold px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors duration-200 shadow-lg"
            >
              Request Ministry Session
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </div>

      {/* Ministry Types Section */}
      <div id="ministry-types" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Ministry Session
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the type of ministry session you would like to request. Each session is led by trained team members who are passionate about serving you.
          </p>
        </div>

        {ministryTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No ministry types are currently available. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ministryTypes.map((ministry) => (
              <Link
                key={ministry._id}
                href={`/virtual-hub/request/${ministry.slug.current}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full border-2 border-transparent hover:border-purple-500">
                  {/* Icon */}
                  {ministry.icon?.asset?.url && (
                    <div className="relative h-48 bg-gradient-to-br from-purple-100 to-purple-200">
                      <Image
                        src={ministry.icon.asset.url}
                        alt={ministry.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                      {ministry.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {ministry.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
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
                        Average: {ministry.averageDuration} minutes
                      </div>
                      <div className="flex items-center text-sm">
                        {ministry.costType === 'free' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            FREE
                          </span>
                        )}
                        {ministry.costType === 'paid' && ministry.price && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            ${ministry.price}
                          </span>
                        )}
                        {ministry.costType === 'both' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Paid & Free Options
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                      Request Session
                      <svg
                        className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Experienced Team</h3>
              <p className="text-gray-600">
                Our staff and volunteers are trained and passionate about ministering to you with excellence.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Virtual Sessions</h3>
              <p className="text-gray-600">
                All sessions are held via Zoom, allowing you to connect from the comfort of your home.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Options</h3>
              <p className="text-gray-600">
                Choose between paid sessions with staff or join our free volunteer-led queue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
