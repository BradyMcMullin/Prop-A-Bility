import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUpNewUser, signInWithGoogle } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!name || !email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const result = await signUpNewUser(email, password, name);

      if (result.success) {
        navigate('/dashboard');
      } else {
        if (result.error && (result.error.includes("already registered") || result.error.includes("unique constraint"))) {
          setError("This email is already associated with an account. Try signing in.");
        } else {
          // Fixed typo: reslt -> result
          setError(result.error || "Failed to sign up");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Added 'relative' to container for absolute positioning of logo
    <div className='relative flex items-center justify-center min-h-screen bg-gray-50 dark:bg-stone-900 transition-colors duration-300'>

      {/* 🟢 Clickable Logo - Top Left */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 group z-10"
      >
        <span className="text-3xl group-hover:scale-110 transition-transform">🌱</span>
        <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 tracking-tight">
          Propability
        </span>
      </Link>

      <div className='w-full max-w-md p-8 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-gray-100 dark:border-stone-700'>

        <h2 className='text-3xl font-bold text-center mb-2 text-emerald-900 dark:text-emerald-100'>Join Propability</h2>
        <p className='text-center text-gray-500 dark:text-stone-400 mb-8'>Start your garden journey today</p>

        {error && (
          <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm'>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className='flex flex-col gap-4'>

          {/* Name Field */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1'>Full Name</label>
            <input
              onChange={(e) => setName(e.target.value)}
              className='w-full p-3 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 dark:text-white transition-all'
              type="text"
              placeholder="Jane Doe"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1'>Email Address</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              className='w-full p-3 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 dark:text-white transition-all'
              type="email"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1'>Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              className='w-full p-3 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 dark:text-white transition-all'
              type="password"
              placeholder="••••••••"
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-6 items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-stone-600"></div>
          <span className="flex-shrink mx-4 text-gray-400 dark:text-stone-500 text-sm">Or continue with</span>
          <div className="flex-grow border-t border-gray-200 dark:border-stone-600"></div>
        </div>

        {/* Google Button */}
        <button
          onClick={signInWithGoogle}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-stone-700 border border-gray-300 dark:border-stone-600 hover:bg-gray-50 dark:hover:bg-stone-600 text-gray-700 dark:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google logo" />
          Sign up with Google
        </button>

        <p className='text-center mt-8 text-gray-600 dark:text-stone-400'>
          Already have an account? <Link to="/signin" className='text-emerald-600 dark:text-emerald-400 font-semibold hover:underline'>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
