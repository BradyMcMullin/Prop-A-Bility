import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import './App.css';


function Dashboard({ session }: { session: Session}) {
  return (
    <div>
      <h1>Welcome, {session.user.email}</h1>
      <p>You are logged in!</p>
      

      <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    //check active session
    supabase.auth.getSession().then(({ data : { session } }) => {
      setSession(session);
    });

    //wait for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="container">
      {!session ? <Auth /> : <Dashboard session={session} />}
    </div>
  );
}

export default App;
