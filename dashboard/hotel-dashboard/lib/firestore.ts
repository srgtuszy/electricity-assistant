import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrOboisE3bcKQFdtcLXAXbK-UdTFwLI_o",
  authDomain: "electricity-assistant-fb2f7.firebaseapp.com",
  projectId: "electricity-assistant-fb2f7",
  storageBucket: "electricity-assistant-fb2f7.appspot.com",
  messagingSenderId: "278136132490",
  appId: "1:278136132490:web:03217cfca6cc7c8505ee73",
  measurementId: "G-LKXDXN77QK"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(firestore, 'localhost', 8081);
  console.log('Connected to Firestore emulator');
}

export { firestore };
