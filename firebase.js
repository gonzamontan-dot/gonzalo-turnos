import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
apiKey: "TU_API_KEY",
authDomain: "TU_DOMINIO.firebaseapp.com",
projectId: "TU_PROYECTO",
storageBucket: "TU_PROYECTO.appspot.com",
messagingSenderId: "XXXXXXXX",
appId: "XXXXXXXX"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
