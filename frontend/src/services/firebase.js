import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging (for push notifications)
let messaging = null;
try {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase messaging not supported:', error);
}

export { messaging };

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Auth emulator
    if (!auth._delegate._config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
    
    // Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Storage emulator
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
    
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

// Push notification functions
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      throw new Error('Messaging not supported');
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      resolve(payload);
    });
  });
};

// Helper functions for Firebase operations
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

export const getIdToken = async (forceRefresh = false) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting ID token:', error);
    throw error;
  }
};

// Error handling helper
export const getFirebaseErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Email tidak ditemukan';
    case 'auth/wrong-password':
      return 'Password salah';
    case 'auth/email-already-in-use':
      return 'Email sudah digunakan';
    case 'auth/weak-password':
      return 'Password terlalu lemah (minimal 6 karakter)';
    case 'auth/invalid-email':
      return 'Format email tidak valid';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah';
    case 'auth/requires-recent-login':
      return 'Silakan login ulang untuk melanjutkan';
    case 'auth/invalid-verification-code':
      return 'Kode verifikasi tidak valid';
    case 'auth/invalid-verification-id':
      return 'ID verifikasi tidak valid';
    case 'auth/code-expired':
      return 'Kode verifikasi sudah kedaluwarsa';
    case 'auth/missing-verification-code':
      return 'Kode verifikasi diperlukan';
    case 'auth/missing-verification-id':
      return 'ID verifikasi diperlukan';
    case 'auth/quota-exceeded':
      return 'Kuota SMS terlampaui. Coba lagi nanti';
    case 'auth/captcha-check-failed':
      return 'Verifikasi reCAPTCHA gagal';
    case 'auth/invalid-phone-number':
      return 'Nomor telepon tidak valid';
    case 'auth/missing-phone-number':
      return 'Nomor telepon diperlukan';
    case 'auth/account-exists-with-different-credential':
      return 'Akun sudah ada dengan metode login berbeda';
    case 'auth/credential-already-in-use':
      return 'Kredensial sudah digunakan akun lain';
    case 'auth/operation-not-allowed':
      return 'Metode login tidak diizinkan';
    case 'auth/invalid-credential':
      return 'Kredensial tidak valid';
    case 'auth/user-disabled':
      return 'Akun telah dinonaktifkan';
    case 'auth/user-token-expired':
      return 'Sesi telah kedaluwarsa. Silakan login ulang';
    case 'auth/web-storage-unsupported':
      return 'Browser tidak mendukung penyimpanan web';
    case 'auth/app-deleted':
      return 'Aplikasi telah dihapus';
    case 'auth/invalid-api-key':
      return 'Kunci API tidak valid';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server';
    case 'auth/internal-error':
      return 'Terjadi kesalahan internal';
    default:
      return error.message || 'Terjadi kesalahan yang tidak diketahui';
  }
};

export default app;