import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    GoogleAuthProvider,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
    auth, 
    googleProvider, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    signInWithRedirect,
    onAuthStateChanged
};
