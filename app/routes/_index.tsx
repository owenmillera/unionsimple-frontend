import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { useAuth } from "../context/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Union Simple - Union Management Made Simple" },
    {
      name: "description",
      content:
        "Modern union management platform. Streamline member management, grievances, payments, and more.",
    },
  ];
}

export function loader() {
  return new Response(
    JSON.stringify({ message: "Welcome to Union Simple" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-warm-light">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-warm-light/95 backdrop-blur-sm border-b border-primary-200 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-lg font-semibold text-primary-900">
                Union Simple
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-primary-700 hover:text-primary-900 transition text-sm"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-primary-700 hover:text-primary-900 transition text-sm"
              >
                Pricing
              </a>
              <a
                href="#resources"
                className="text-primary-700 hover:text-primary-900 transition text-sm"
              >
                Resources
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition text-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="px-4 py-2 text-primary-700 hover:text-primary-900 transition text-sm rounded-md"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary-900 mb-6 leading-tight">
              Union Management
              <br />
              Made Simple
            </h1>
            <p className="text-xl md:text-2xl text-primary-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your union operations with a modern platform designed
              for member management, grievances, payments, and reporting. Built
              for unions, by people who understand unions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="inline-flex items-center px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition text-base font-medium"
              >
                Get Started Free
              </Link>
              <button className="inline-flex items-center px-6 py-3 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition text-base font-medium">
                Watch Demo
              </button>
            </div>
            <p className="text-sm text-primary-600 mt-6">
              No credit card required • Free 14-day trial
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="relative rounded-lg border border-primary-200 shadow-2xl overflow-hidden bg-white">
              <div className="bg-primary-50 border-b border-primary-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 max-w-md mx-4">
                  <div className="bg-white border border-primary-200 rounded px-3 py-1.5 text-sm text-primary-600">
                    unionsimple.com/dashboard
                  </div>
                </div>
                <div className="w-16"></div>
              </div>
              <div className="aspect-[16/10] bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
                {/* Dashboard Content Preview */}
                <div className="absolute inset-0 p-8">
                  <div className="grid grid-cols-12 gap-4 h-full">
                    {/* Sidebar */}
                    <div className="col-span-3 bg-white rounded-lg border border-primary-200 p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-primary-200 rounded w-3/4"></div>
                        <div className="h-4 bg-primary-200 rounded w-1/2"></div>
                        <div className="h-4 bg-primary-200 rounded w-2/3"></div>
                        <div className="h-4 bg-primary-200 rounded w-4/5"></div>
                      </div>
                    </div>
                    {/* Main Content */}
                    <div className="col-span-9 space-y-4">
                      <div className="bg-white rounded-lg border border-primary-200 p-6">
                        <div className="h-6 bg-primary-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-primary-100 rounded w-full"></div>
                          <div className="h-4 bg-primary-100 rounded w-5/6"></div>
                          <div className="h-4 bg-primary-100 rounded w-4/6"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-primary-200 p-4">
                          <div className="h-4 bg-primary-200 rounded w-1/2 mb-2"></div>
                          <div className="h-8 bg-primary-100 rounded w-3/4"></div>
                        </div>
                        <div className="bg-white rounded-lg border border-primary-200 p-4">
                          <div className="h-4 bg-primary-200 rounded w-1/2 mb-2"></div>
                          <div className="h-8 bg-primary-100 rounded w-3/4"></div>
                        </div>
                        <div className="bg-white rounded-lg border border-primary-200 p-4">
                          <div className="h-4 bg-primary-200 rounded w-1/2 mb-2"></div>
                          <div className="h-8 bg-primary-100 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 lg:px-8 bg-white border-t border-primary-200"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
              Everything you need to manage your union
            </h2>
            <p className="text-lg text-primary-700 max-w-2xl mx-auto">
              Powerful features designed to simplify union operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-primary-200 hover:border-primary-300 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-primary-700 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-warm-light">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            Ready to simplify your union management?
          </h2>
          <p className="text-lg text-primary-700 mb-10">
            Join unions across the country who trust Union Simple to manage their
            operations
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-primary-900 text-white rounded-md hover:bg-primary-950 transition text-base font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-200 py-12 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 flex items-center">
              <span className="text-lg font-semibold text-primary-900">
                Union Simple
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-primary-700">
              <a href="#" className="hover:text-primary-900 transition">
                Privacy
              </a>
              <a href="#" className="hover:text-primary-900 transition">
                Terms
              </a>
              <a href="#" className="hover:text-primary-900 transition">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-primary-600">
            © {new Date().getFullYear()} Union Simple. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Member Management",
    description:
      "Keep track of all your members in one place. Manage profiles, roles, and membership status with ease.",
    icon: (
      <svg
        className="w-5 h-5 text-primary-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "Grievance Tracking",
    description:
      "Streamline the grievance process from submission to resolution. Track status, assign handlers, and maintain records.",
    icon: (
      <svg
        className="w-5 h-5 text-primary-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: "Payment Processing",
    description:
      "Manage dues, track payments, and generate invoices. Automated reminders and payment history tracking.",
    icon: (
      <svg
        className="w-5 h-5 text-primary-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "Reporting & Analytics",
    description:
      "Generate comprehensive reports on membership, finances, and operations. Make data-driven decisions.",
    icon: (
      <svg
        className="w-5 h-5 text-primary-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: "Event Management",
    description:
      "Organize union events, meetings, and activities. Send invitations and track attendance.",
    icon: (
      <svg
        className="w-5 h-5 text-primary-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "Secure & Compliant",
    description:
      "Bank-level security with compliance built-in. Your data is safe, encrypted, and always accessible.",
    icon: (
      <svg
        className="w-5 h-5 text-primary-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
];
