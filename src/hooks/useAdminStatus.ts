import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../services/firebase';

interface AdminStatus {
  uid: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  error?: Error;
}

export const useAdminStatus = (uid: string | null) => {
  const [status, setStatus] = useState<AdminStatus>({
    uid: null,
    isAdmin: false,
    isLoading: false,
  });

  if (status.uid !== uid) {
    setStatus({ uid, isAdmin: false, isLoading: uid !== null });
  }

  useEffect(() => {
    if (!uid) {
      return;
    }

    return onValue(
      ref(database, `admins/${uid}`),
      (snapshot) => {
        setStatus({ uid, isAdmin: snapshot.val() === true, isLoading: false });
      },
      (cause) => {
        setStatus({
          uid,
          isAdmin: false,
          isLoading: false,
          error: cause,
        });
      },
    );
  }, [uid]);

  return {
    isAdmin: status.isAdmin,
    isLoading: status.isLoading,
    error: status.error,
  };
};
