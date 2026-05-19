// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use //
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyD2bM1AF2xxkLMY9KJsB80Chw2wOFZPia8',
  authDomain: 'hackathon-16574.firebaseapp.com',
  projectId: 'hackathon-16574',
  storageBucket: 'hackathon-16574.firebasestorage.app',
  messagingSenderId: '397993716360',
  appId: '1:397993716360:web:021989575ce4c9b6a88d3d',
  measurementId: 'G-5JS3NKH64W',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
