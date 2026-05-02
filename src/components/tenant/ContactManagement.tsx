import React from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../shared/Card';
import Button from '../shared/Button';
import { useSiteSettings } from '../../context/SiteSettingsContext';

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits || phone}`;
}

const ContactManagement: React.FC = () => {
  const { settings } = useSiteSettings();

  const handleCall = () => {
    window.location.href = telHref(settings.phone);
  };

  const handleEmergency = () => {
    window.location.href = telHref(settings.emergencyPhone);
  };

  const handleEmail = () => {
    window.location.href = `mailto:${encodeURIComponent(settings.managementEmail)}`;
  };

  const handleChat = () => {
    if (settings.liveChatEnabled && settings.liveChatUrl) {
      window.open(settings.liveChatUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    toast.error('Live chat is not configured. Use phone or email.');
  };

  return (
    <Card
      title="Contact Management Office"
      className="h-full"
      bodyClassName="!py-6"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={handleCall}
            leftIcon={<Phone className="h-5 w-5" />}
            fullWidth
          >
            Call office
          </Button>
          <Button
            variant="secondary"
            onClick={handleEmail}
            leftIcon={<Mail className="h-5 w-5" />}
            fullWidth
          >
            Email us
          </Button>
          <Button
            variant="success"
            onClick={handleChat}
            leftIcon={<MessageSquare className="h-5 w-5" />}
            fullWidth
            disabled={!settings.liveChatEnabled || !settings.liveChatUrl}
          >
            Live chat
          </Button>
        </div>

        <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Office hours</h4>
            <p className="whitespace-pre-line">{settings.officeHours}</p>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <p className="font-medium text-gray-900 mb-1">Main line</p>
            <button
              type="button"
              onClick={handleCall}
              className="text-blue-600 hover:text-blue-800"
            >
              {settings.phone}
            </button>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">After hours / emergencies</p>
            <button
              type="button"
              onClick={handleEmergency}
              className="text-blue-600 hover:text-blue-800"
            >
              {settings.emergencyPhone}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContactManagement;
