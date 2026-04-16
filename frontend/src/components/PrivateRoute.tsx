import { UserAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { session } = UserAuth();

  if (session === undefined) {
    return <p>Loading..</p>;
  }

  return <>{session ? <>{children}</> : <Navigate to='/signin' />}</>;
};

export default PrivateRoute
