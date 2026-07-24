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

    loading: boolean;

    setUser: (user: User | null) => void;

    setLoading: (loading: boolean) => void;

    logout: () => void;

}

export const useAuthStore = create<AuthStore>((set) => ({

    user: null,

    loading: true,

    setUser: (user) =>
        set({
            user,
        }),

    setLoading: (loading) =>
        set({
            loading,
        }),

    logout: () =>
        set({
            user: null,
        }),

}));
