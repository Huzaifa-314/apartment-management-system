import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const WelcomeMessage: React.FC<{ userName: string }> = ({ userName }) => {
  const { settings } = useSiteSettings();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: <Sun className="h-6 w-6 text-amber-500" /> };
    if (hour < 17) return { text: 'Good Afternoon', icon: <Sun className="h-6 w-6 text-amber-500" /> };
    if (hour < 20) return { text: 'Good Evening', icon: <Moon className="h-6 w-6 text-blue-500" /> };
    return { text: 'Good Night', icon: <Moon className="h-6 w-6 text-blue-500" /> };
  };

  const greeting = getTimeBasedGreeting();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl px-6 py-5 text-white shadow-md">
      <div className="flex items-center space-x-2.5 mb-1.5">
        {greeting.icon}
        <h1 className="text-2xl font-bold">
          {greeting.text}, {userName}
        </h1>
      </div>
      <p className="text-blue-100 text-sm">
        Welcome back to your {settings.propertyName} resident dashboard.
      </p>
    </div>
  );
};

export default WelcomeMessage;
