"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types";

const USER_KEY = "fintrack_user";

export interface AuthUser {
    id: number;
    fullName: string;
    email: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    // true until we've checked localStorage in the browser
    loading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function saveSession(response: AuthResponse): AuthUser {
    const user = { id: response.userId, fullName: response.fullName, email: response.email };
    setToken(response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
}

function readStoredUser(): AuthUser | null {
    if (!getToken()) return null;
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // localStorage only exists in the browser, so read the session after the first render
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage
        setUser(readStoredUser());
        setLoading(false);
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        setUser(saveSession(await api.login(data)));
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        setUser(saveSession(await api.register(data)));
    }, []);

    const logout = useCallback(() => {
        clearToken();
        localStorage.removeItem(USER_KEY);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider.");
    return context;
}