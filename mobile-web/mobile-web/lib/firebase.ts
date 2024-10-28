import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrOboisE3bcKQFdtcLXAXbK-UdTFwLI_o",
  authDomain: "electricity-assistant-fb2f7.firebaseapp.com",
  projectId: "electricity-assistant-fb2f7",
  storageBucket: "electricity-assistant-fb2f7.appspot.com",
  messagingSenderId: "278136132490",
  appId: "1:278136132490:web:b933d6adc0337b2b05ee73",
  measurementId: "G-MJ2ZPJ6HM0"
};

const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);
