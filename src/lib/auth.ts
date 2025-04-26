import { create } from "zustand";
import { persist } from "zustand/middleware";
import { endpoints } from "../config/axios";
import { setToken, TOKEN_KEY } from "../utils";
import toast from "react-hot-toast";
import { User } from "../types";

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    profileLoading: boolean;
    profileError: string | null;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => void;
    fetchProfile: () => Promise<User | null>;
    updateProfile: (user: User) => Promise<void>;
    checkAuth: () => Promise<boolean>;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            profileLoading: false,
            profileError: null,
            login: async (credentials: { email: string; password: string }) => {
                set({ isLoading: true });

                try {
                    const response = await endpoints.auth.login(credentials);
                    const { user, token } = response.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                    });

                    // Store token in localStorage for the axios interceptor
                    setToken(token);
                    toast.success(`Welcome back, ${user.name}!`);
                } catch (error) {
                    toast.error("Login failed");
                    console.error(error);
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    const response = await endpoints.auth.logout();
                    if (response.status === 200) {
                        // Clear token from localStorage
                        localStorage.removeItem(TOKEN_KEY);
                        set({
                            user: null,
                            token: null,
                            isAuthenticated: false,
                        });
                        toast.success("You have been logged out");
                    }
                } catch (error) {
                    console.error("Logout error:", error);
                    // Even if the API call fails, we should still clear local state
                    localStorage.removeItem(TOKEN_KEY);
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                    });
                    toast.success("You have been logged out");
                }
            },

            fetchProfile: async () => {
                const { token } = get();

                if (!token) {
                    set({ profileError: "No authentication token found" });
                    return null;
                }

                set({ profileLoading: true, profileError: null });

                try {
                    // Make sure token is in localStorage for the interceptor
                    setToken(token);

                    const response = await endpoints.auth.profile();
                    console.log("Profile response:", response.data);

                    if (response.status === 200 && response.data) {
                        // Handle both possible response structures:
                        // 1. Direct user object: { name, email, phone, ... }
                        // 2. Nested user object: { data: { name, email, phone, ... } }
                        const userData = response.data.user || response.data;

                        // Create a normalized user object that has consistent structure
                        const normalizedUser = {
                            ...userData,
                            // If data exists and contains user properties, merge them
                            ...(userData.data ? userData.data : {}),
                        };

                        console.log("Normalized user:", normalizedUser);

                        set({
                            user: normalizedUser,
                            isAuthenticated: true,
                            profileError: null,
                        });
                        return normalizedUser;
                    } else {
                        set({ profileError: "Failed to fetch profile" });
                        return null;
                    }
                } catch (error) {
                    console.error("Profile fetch error:", error);
                    set({
                        profileError: "Error fetching profile",
                        isAuthenticated: false,
                    });
                    return null;
                } finally {
                    set({ profileLoading: false });
                }
            },

            updateProfile: async (user: User): Promise<void> => {
                const { token } = get();

                if (!token) {
                    set({ profileError: "No authentication token found" });
                    return;
                }

                set({ profileLoading: true, profileError: null });

                try {
                    // Make sure token is in localStorage for the interceptor
                    setToken(token);

                    const response = await endpoints.auth.updateProfile(user);
                    
                    if (response.status === 200 && response.data) {
                        // Handle both possible response structures
                        const userData = response.data.user || response.data;
                        
                        // Create a normalized user object
                        const normalizedUser = {
                            ...userData,
                            ...(userData.data ? userData.data : {}),
                        };
                        
                        set({
                            user: normalizedUser,
                            isAuthenticated: true,
                            profileError: null,
                        });
                        
                        toast.success("Profile updated successfully");
                    } else {
                        set({ profileError: "Failed to update profile" });
                    }
                } catch (error) {
                    console.error("Profile update error:", error);
                    set({
                        profileError: "Error updating profile",
                        isAuthenticated: false,
                    });
                    toast.error("Failed to update profile");
                } finally {
                    set({ profileLoading: false });
                }
            },

            checkAuth: async () => {
                const { token, user } = get();

                // If we already have a user and token, consider authenticated
                if (user && token) {
                    return true;
                }

                // If we have a token but no user, try to fetch the profile
                if (token && !user) {
                    const profile = await get().fetchProfile();
                    return !!profile;
                }

                return false;
            },
        }),
        {
            name: "portfolio-auth",
        }
    )
);
