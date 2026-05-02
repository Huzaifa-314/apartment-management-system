import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Building, UserPlus } from 'lucide-react';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import { useAuth } from '../context/AuthContext';

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'tenant'>('tenant');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await register(name, email, password, confirmPassword, role, phone || undefined);

    if (result.success && result.role) {
      if (result.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/tenant/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-8 text-center">
            <div className="mb-4 flex justify-center">
              <Building className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">RoomMaster</h1>
            <p className="text-blue-100 mt-2">Premium Room Management System</p>
          </div>

          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Create your account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  type="text"
                  id="name"
                  label="Full Name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  leftIcon={<User className="h-5 w-5 text-gray-500" />}
                  fullWidth
                />

                <Input
                  type="email"
                  id="email"
                  label="Email Address"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail className="h-5 w-5 text-gray-500" />}
                  fullWidth
                />

                <Input
                  type="password"
                  id="password"
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  leftIcon={<Lock className="h-5 w-5 text-gray-500" />}
                  fullWidth
                />

                <Input
                  type="password"
                  id="confirmPassword"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  leftIcon={<Lock className="h-5 w-5 text-gray-500" />}
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('tenant')}
                      className={`py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                        role === 'tenant'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                        role === 'admin'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <Input
                  type="tel"
                  id="phone"
                  label="Phone Number (optional)"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-5 w-5 text-gray-500" />}
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  rightIcon={<UserPlus className="h-5 w-5" />}
                >
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          © 2025 RoomMaster. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Register;
