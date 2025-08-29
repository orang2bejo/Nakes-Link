import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Initialize auth listener
      initializeAuth: () => {
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
              if (firebaseUser) {
                // Get user data from backend
                const response = await authAPI.getProfile();
                const userData = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  emailVerified: firebaseUser.emailVerified,
                  ...response.data
                };
                
                get().setUser(userData);
              } else {
                get().setUser(null);
              }
            } catch (error) {
              console.error('Error getting user profile:', error);
              get().setUser(null);
            } finally {
              resolve();
            }
          });

          // Return unsubscribe function
          return unsubscribe;
        });
      },

      // Login with email and password
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          // Sign in with Firebase
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Get user data from backend
          const response = await authAPI.getProfile();
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            ...response.data
          };
          
          get().setUser(userData);
          toast.success('Login berhasil!');
          
          return { success: true, user: userData };
        } catch (error) {
          console.error('Login error:', error);
          const errorMessage = get().getErrorMessage(error);
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      // Register new user
      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const { email, password, ...profileData } = userData;
          
          // Create user with Firebase
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Update Firebase profile
          await updateProfile(firebaseUser, {
            displayName: `${profileData.firstName} ${profileData.lastName}`
          });
          
          // Create user profile in backend
          const response = await authAPI.register({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            ...profileData
          });
          
          const newUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            ...response.data
          };
          
          get().setUser(newUser);
          toast.success('Registrasi berhasil!');
          
          return { success: true, user: newUser };
        } catch (error) {
          console.error('Registration error:', error);
          const errorMessage = get().getErrorMessage(error);
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      // Logout
      logout: async () => {
        try {
          set({ isLoading: true });
          await signOut(auth);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
          toast.success('Logout berhasil!');
          return { success: true };
        } catch (error) {
          console.error('Logout error:', error);
          const errorMessage = get().getErrorMessage(error);
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      // Reset password
      resetPassword: async (email) => {
        try {
          set({ isLoading: true, error: null });
          await sendPasswordResetEmail(auth, email);
          set({ isLoading: false });
          toast.success('Email reset password telah dikirim!');
          return { success: true };
        } catch (error) {
          console.error('Reset password error:', error);
          const errorMessage = get().getErrorMessage(error);
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      // Update profile
      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true, error: null });
          
          // Update backend profile
          const response = await authAPI.updateProfile(profileData);
          
          // Update Firebase profile if display name changed
          if (profileData.firstName || profileData.lastName) {
            const displayName = `${profileData.firstName || get().user.firstName} ${profileData.lastName || get().user.lastName}`;
            await updateProfile(auth.currentUser, { displayName });
          }
          
          // Update local user state
          const updatedUser = {
            ...get().user,
            ...response.data
          };
          
          get().setUser(updatedUser);
          set({ isLoading: false });
          toast.success('Profil berhasil diperbarui!');
          
          return { success: true, user: updatedUser };
        } catch (error) {
          console.error('Update profile error:', error);
          const errorMessage = get().getErrorMessage(error);
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      // Helper function to get user-friendly error messages
      getErrorMessage: (error) => {
        if (error.code) {
          switch (error.code) {
            case 'auth/user-not-found':
              return 'Email tidak ditemukan';
            case 'auth/wrong-password':
              return 'Password salah';
            case 'auth/email-already-in-use':
              return 'Email sudah digunakan';
            case 'auth/weak-password':
              return 'Password terlalu lemah';
            case 'auth/invalid-email':
              return 'Format email tidak valid';
            case 'auth/too-many-requests':
              return 'Terlalu banyak percobaan. Coba lagi nanti';
            case 'auth/network-request-failed':
              return 'Koneksi internet bermasalah';
            default:
              return error.message || 'Terjadi kesalahan';
          }
        }
        
        if (error.response?.data?.message) {
          return error.response.data.message;
        }
        
        return error.message || 'Terjadi kesalahan';
      },

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.role);
      },

      // Get user permissions
      getPermissions: () => {
        const { user } = get();
        return user?.permissions || [];
      },

      // Check if user has specific permission
      hasPermission: (permission) => {
        const permissions = get().getPermissions();
        return permissions.includes(permission);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export { useAuthStore };