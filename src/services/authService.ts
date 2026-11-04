import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { firebaseApp } from './firebase';

export const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<void> => {
  await signInWithPopup(auth, googleProvider);
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};
