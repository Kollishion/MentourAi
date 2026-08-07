import { create } from "zustand";

export type UserRole = "USER" | "ADMIN";

export type AccountStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED"
    | "DELETED";

export interface User {
    id: string;

    username: string;

    email: string;

    role: UserRole;

    status: AccountStatus;

    emailVerified: boolean;

    lastLoginAt: string | null;

    createdAt: string;

    updatedAt: string;
}

interface AuthStore {
    user: User | null;
    token: string | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    token: localStorage.getItem("accessToken"),
    loading: true,
    setUser: (user) =>
        set({
            user,
        }),
    setToken: (token) => {
        if (token) {
            localStorage.setItem("accessToken", token);
        } else {
            localStorage.removeItem("accessToken");
        }
        set({ token });
    },
    setLoading: (loading) =>
        set({
            loading,
        }),
    logout: () => {
        localStorage.removeItem("accessToken");
        set({
            user: null,
            token: null,
        });
    },
}));
