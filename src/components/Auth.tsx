imporrt { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] =useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) =>{
    e.preventDefault();
    setLoading(true);
    setMessage('');

    let error;

    if (isSignUp) {
      const {error: signUpError} = await supabase.auth.signup({
        email,
        password,
      });
      if (!signUpError) setMessage('Check your email for the login link!');
      error = signUpError;
    } else {
      const  { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    }

    if (error) setMessage(error.message);
    setLoading(false);
  };

  return (
    <div className="card" style={{maxWidth: '400px', margin: '0 auto'}}>
      <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
      <p>Sign in to save your propagations</p>

      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px'}}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange{(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      {message && <p style={{ marginTop: '10px', color: message.includes('Check') ? 'green' : 'red' }}> {message}</p>}

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ background: 'transparent', border: 'none', color: '#646cff', marginTop: '10px', cursor: 'pointer'}}
      >
        {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
}
