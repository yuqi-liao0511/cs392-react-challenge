import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/authService';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // true until Firebase has checked whether someone is already signed in
  isInitialLoading: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setIsInitialLoading(false);
      }),
    [],
  );

  return { user, isAuthenticated: user !== null, isInitialLoading };
};
