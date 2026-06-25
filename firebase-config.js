// Configuración Central de Firebase para el CRM de Aligned Spaces
// Usando modo "Compat" para que funcione sin servidor local (doble clic)

const firebaseConfig = {
  apiKey: "AIzaSyAebjIulNEMrbPnHsKNB85PhhsU5vvObM0",
  authDomain: "aligned-spaces-crm.firebaseapp.com",
  projectId: "aligned-spaces-crm",
  storageBucket: "aligned-spaces-crm.firebasestorage.app",
  messagingSenderId: "779987516027",
  appId: "1:779987516027:web:b083b96e3d1190847800de",
  measurementId: "G-RF3W47J07Z"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Exponemos auth y db para que los usen admin.html y dashboard.html
window.auth = auth;
window.db = db;

// Expose globally for quote-new.js
window.saveBookingToCRM = async function(bookingData) {
    try {
        await db.collection("bookings").add({
            ...bookingData,
            status: "Pending",
            paymentStatus: "Pending",
            privateNotes: "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Successfully saved booking to Firebase CRM.");
    } catch (e) {
        console.error("Error saving booking to CRM: ", e);
    }
};

// Expose globally for script.js (Contact Forms)
window.saveInquiryToCRM = async function(inquiryData) {
    try {
        await db.collection("inquiries").add({
            ...inquiryData,
            status: "New",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Successfully saved inquiry to Firebase CRM.");
    } catch (e) {
        console.error("Error saving inquiry to CRM: ", e);
    }
};
