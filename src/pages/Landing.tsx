import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, CreditCard, Users } from 'lucide-react';
import Button from '../components/shared/Button';
import PublicSiteHeader from '../components/shared/PublicSiteHeader';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const { user } = useAuth();
  const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/tenant/dashboard';
  const primaryCtaHref = user ? dashboardHref : '/register';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <PublicSiteHeader variant="landing" />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            Master Villa
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Premium room management system for modern property management
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={primaryCtaHref}>
              <Button variant="primary" size="lg">
                {user ? 'Go to dashboard' : 'Get Started'}
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Log in
              </Button>
            </Link>
            <Link to="/rooms">
              <Button variant="secondary" size="lg">
                Browse Rooms
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: <Building2 className="h-8 w-8 text-blue-500" />,
              title: "Room Management",
              description: "Efficiently manage all your properties in one place"
            },
            {
              icon: <Shield className="h-8 w-8 text-green-500" />,
              title: "Secure Platform",
              description: "Bank-grade security for all your transactions"
            },
            {
              icon: <CreditCard className="h-8 w-8 text-purple-500" />,
              title: "Online Payments",
              description: "Hassle-free rent collection and tracking"
            },
            {
              icon: <Users className="h-8 w-8 text-amber-500" />,
              title: "Tenant Portal",
              description: "Self-service portal for your tenants"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="bg-blue-600 dark:bg-blue-800 rounded-2xl p-8 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-white text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of property managers who trust Master Villa
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={primaryCtaHref}>
              <Button variant="primary" size="lg">
                {user ? 'Go to dashboard' : 'Start Free Trial'}
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Log in
              </Button>
            </Link>
            <Link to="/rooms">
              <Button variant="secondary" size="lg">
                Browse Rooms
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;