import React from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import Card from '../shared/Card';
import Button from '../shared/Button';

const ContactManagement: React.FC = () => {
  const handleCall = () => {
    window.location.href = 'tel:+1234567890';
  };

  const handleEmail = () => {
    window.location.href = 'mailto:management@mastervilla.com';
  };

  const handleChat = () => {
    // Implement chat functionality
    alert('Chat feature coming soon!');
  };

  return (
    <Card title="Contact Management Office" className="bg-white shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="primary"
          onClick={handleCall}
          leftIcon={<Phone className="h-5 w-5" />}
          fullWidth
        >
          Call Office
        </Button>
        <Button
          variant="secondary"
          onClick={handleEmail}
          leftIcon={<Mail className="h-5 w-5" />}
          fullWidth
        >
          Send Email
        </Button>
        <Button
          variant="success"
          onClick={handleChat}
          leftIcon={<MessageSquare className="h-5 w-5" />}
          fullWidth
        >
          Live Chat
        </Button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Office Hours</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
          <p>Saturday: 10:00 AM - 2:00 PM</p>
          <p>Sunday: Closed</p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          For emergencies outside office hours, please call our 24/7 helpline: +1234567890
        </p>
      </div>
    </Card>
  );
};

export default ContactManagement;