import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyDfnPNk8BI0lP2MuCw7_Kzu4srh3Uuvo7I',
  authDomain: 'cs392-react-challenge-692dd.firebaseapp.com',
  databaseURL: 'https://cs392-react-challenge-692dd-default-rtdb.firebaseio.com',
  projectId: 'cs392-react-challenge-692dd',
  storageBucket: 'cs392-react-challenge-692dd.firebasestorage.app',
  messagingSenderId: '958769498219',
  appId: '1:958769498219:web:6045b02e7071cfe532892e',
  measurementId: 'G-T142SYFJQL',
});

export const database = getDatabase(firebaseApp);
