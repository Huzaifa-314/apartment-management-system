import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, Building } from 'lucide-react';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const safeRedirect = (path: string | null) =>
    path && path.startsWith('/') && !path.startsWith('//') ? path : null;

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    const result = await login(email, password);
    
    if (result.success && result.role) {
      const redirectTarget = safeRedirect(searchParams.get('redirect'));
      if (redirectTarget) {
        navigate(redirectTarget);
        return;
      }
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
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  leftIcon={<Lock className="h-5 w-5 text-gray-500" />}
                  fullWidth
                />
                
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={loading}
                  rightIcon={<LogIn className="h-5 w-5" />}
                >
                  Sign in
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>
                Demo login credentials:
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-700">Admin:</span> admin@example.com
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-700">Tenant:</span> tenant1@example.com
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-700">Password:</span> password
              </p>
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

export default Login;