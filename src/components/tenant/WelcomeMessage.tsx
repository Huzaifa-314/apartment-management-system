import React from 'react';
import { Sun, Moon } from 'lucide-react';

const WelcomeMessage: React.FC<{ userName: string }> = ({ userName }) => {
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: <Sun className="h-6 w-6 text-amber-500" /> };
    if (hour < 17) return { text: 'Good Afternoon', icon: <Sun className="h-6 w-6 text-amber-500" /> };
    if (hour < 20) return { text: 'Good Evening', icon: <Moon className="h-6 w-6 text-blue-500" /> };
    return { text: 'Good Night', icon: <Moon className="h-6 w-6 text-blue-500" /> };
  };

  const greeting = getTimeBasedGreeting();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex items-center space-x-3 mb-4">
        {greeting.icon}
        <h1 className="text-3xl font-bold">{greeting.text}, {userName}!</h1>
      </div>
      <p className="text-blue-100 text-lg">Welcome to your personal dashboard at Master Villa.</p>
      <p className="text-blue-200 mt-2">We're here to make your stay comfortable and convenient.</p>
    </div>
  );
};

export default WelcomeMessage;