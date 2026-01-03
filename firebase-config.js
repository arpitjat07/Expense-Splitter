// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXiPUnnM1ar19o7zjwCVVdyT96cOs2NWI",
    authDomain: "expense-splitter-da225.firebaseapp.com",
    projectId: "expense-splitter-da225",
    storageBucket: "expense-splitter-da225.firebasestorage.app",
    messagingSenderId: "827700940746",
    appId: "1:827700940746:web:0cd0c3686369ca0d2fc933"
};

// Initialize Firebase
// Check if firebase is already initialized to avoid errors
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Make services globally available
window.db = firebase.firestore();
window.auth = firebase.auth();

console.log("Firebase initialized successfully with new config");
