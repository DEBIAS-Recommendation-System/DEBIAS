'use client';

import { useState } from 'react';
import { authApi } from '@/api/fastapi';
import { LoginRequest, SignupRequest } from '@/types/fastapi.types';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [loginForm, setLoginForm] = useState<LoginRequest>({
    username: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState<SignupRequest>({
    full_name: '',
    username: '',
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.login(loginForm);
      router.push('/'); // Redirect to home after login
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.signup(signupForm);
      // After signup, automatically login
      await authApi.login({
        username: signupForm.username,
        password: signupForm.password,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Mode Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 font-semibold rounded ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 font-semibold rounded ${
              mode === 'signup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                required
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-md"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <label htmlFor="signup-fullname" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="signup-fullname"
                type="text"
                required
                value={signupForm.full_name}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, full_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                required
                value={signupForm.username}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, username: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={signupForm.email}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-md"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
