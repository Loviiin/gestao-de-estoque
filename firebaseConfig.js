// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6JQuRnma7dFi7QEnt4cODmbfOrMmOZIc",
  authDomain: "gestao-de-estoque-50baa.firebaseapp.com",
  projectId: "gestao-de-estoque-50baa",
  storageBucket: "gestao-de-estoque-50baa.appspot.com",
  messagingSenderId: "355210098837",
  appId: "1:355210098837:web:a74c226a587fbc30fbc39c",
  measurementId: "G-LKWEXSWGF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);