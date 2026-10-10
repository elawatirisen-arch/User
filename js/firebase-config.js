// ===================================================================
// ALIPSTORE — Firebase config (USER app)
// HARUS SAMA PERSIS dengan konfigurasi di admin/js/firebase-config.js,
// karena kedua web ini memakai satu project (database) yang sama.
// ===================================================================
export const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

export const STORE_INFO = {
  name: "ALIPSTORE",
  tagline: "Marketplace Digital Premium",
  whatsapp: "6285840840520", // default — bisa ditimpa oleh pengaturan di Firestore (settings/store)
  telegram: "Alipgg61"
};
