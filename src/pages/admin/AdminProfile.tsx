import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

type MeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
};

const AdminProfile: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<MeUser | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<{ user: MeUser }>('/api/auth/me');
        setProfile(data.user);
      } catch {
        toast.error('Could not refresh profile');
        if (authUser) {
          setProfile({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            role: authUser.role,
            phone: authUser.phone,
          });
        }
      }
    };
    load();
  }, [authUser]);

  const u = profile || authUser;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
        <p className="text-gray-600">Administrator account details</p>
      </div>

      <div className="max-w-lg">
        <Card title="Account">
          {u ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                  <p className="font-medium text-gray-900">{u.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="font-medium text-gray-900">{u.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                  <p className="font-medium text-gray-900 capitalize">{u.role}</p>
                </div>
              </div>
              {u.phone ? (
                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">Phone:</span> {u.phone}
                </div>
              ) : null}
              <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">
                Password changes are not available in this demo. Use the server script to reset admin
                credentials if needed.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="secondary" leftIcon={<LogOut className="h-5 w-5" />} onClick={() => logout()}>
                  Sign out
                </Button>
                <Link to="/">
                  <Button variant="ghost" type="button">
                    Back to site
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading…</p>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminProfile;
