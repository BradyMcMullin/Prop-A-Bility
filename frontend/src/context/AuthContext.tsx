import { createContext, useEffect, useState, useContext } from 'react'
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined)

  // Sign up (Updated to include Name)
  const signUpNewUser = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name, // This saves the name to user_metadata
        }
      }
    });

    if (error) {
      console.error("there was a problem signing up:", error.message)
      return { success: false, error: error.message };
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: "This email is already in use." };
    }

    return { success: true, data };
  };

  // Sign in with Email
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  };

  // Sign in with Google (NEW)
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect back to your dashboard after Google login
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) console.error("Google login error:", error)
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("there was an error: ", error)
    }
  };

  // Session Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const UserAuth = () => {
  return useContext(AuthContext);
};
