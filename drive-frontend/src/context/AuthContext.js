'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = api.getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await api.getProfile();
            setUser(data.data.user);
        } catch {
            api.removeToken();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        setUser(data.data.user);
        return data;
    };

    const register = async (name, email, password) => {
        const data = await api.register(name, email, password);
        setUser(data.data.user);
        return data;
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const data = await api.getProfile();
            setUser(data.data.user);
        } catch {
            // silent
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
