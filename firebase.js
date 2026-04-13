import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*
COMO CAMBIAR LOS DATOS:
1. Entrá a Firebase Console
2. Abrí tu proyecto
3. Tocá el engranaje -> Configuración del proyecto
4. Bajá hasta 'Tus apps'
5. Elegí la app web
6. Copiá el bloque firebaseConfig
7. Pegalo acá abajo
*/

const firebaseConfig = {
  apiKey: "AIzaSyCbFBto-0PhnVw3sdJOhpY6NI3OZ5lkBYQ",
  authDomain: "gonzalo-turnos.firebaseapp.com",
  projectId: "gonzalo-turnos",
  storageBucket: "gonzalo-turnos.firebasestorage.app",
  messagingSenderId: "739858386287",
  appId: "1:739858386287:web:2ff5278cbf8d6dcdb12c9a",
  measurementId: "G-4QQRSFYKD8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
