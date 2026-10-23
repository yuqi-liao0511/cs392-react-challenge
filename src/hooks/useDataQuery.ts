import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../services/firebase';

// Subscribes to a location in the Realtime Database. Firebase calls the
// listener once with the current data and again every time it changes.
export const useDataQuery = (path: string): [unknown, boolean, Error | undefined] => {
  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(
    () =>
      onValue(
        ref(database, path),
        (snapshot) => {
          setData(snapshot.val());
          setError(undefined);
          setLoading(false);
        },
        (cause) => {
          setError(cause);
          setLoading(false);
        },
      ),
    [path],
  );

  return [data, loading, error];
};
