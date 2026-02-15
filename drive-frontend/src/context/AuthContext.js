'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { deriveKey, generateSalt } from '@/lib/crypto';

const AuthContext = createContext(null);
const ENC_KEY_STORAGE = 'vault_enc_key';

// Helper: export CryptoKey to sessionStorage
async function saveKeyToSession(key) {
    try {
        const exported = await crypto.subtle.exportKey('jwk', key);
        sessionStorage.setItem(ENC_KEY_STORAGE, JSON.stringify(exported));
    } catch { /* non-critical */ }
}

// Helper: restore CryptoKey from sessionStorage
async function restoreKeyFromSession() {
    try {
        const stored = sessionStorage.getItem(ENC_KEY_STORAGE);
        if (!stored) return null;
        const jwk = JSON.parse(stored);
        return crypto.subtle.importKey(
            'jwk', jwk,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    } catch { return null; }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const encryptionKeyRef = useRef(null);

    const loadUser = useCallback(async () => {
        const token = api.getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await api.getProfile();
            setUser(data.data.user);

            // Restore encryption key from sessionStorage on page refresh
            if (!encryptionKeyRef.current) {
                const restored = await restoreKeyFromSession();
                if (restored) encryptionKeyRef.current = restored;
            }
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

        // Derive encryption key from password + salt
        const salt = data.data.encryptionSalt;
        if (salt) {
            const key = await deriveKey(password, salt);
            encryptionKeyRef.current = key;
            await saveKeyToSession(key);
        }

        return data;
    };

    const register = async (name, email, password) => {
        // Generate encryption salt and derive key
        const salt = generateSalt();
        const data = await api.register(name, email, password, salt);
        setUser(data.data.user);

        const key = await deriveKey(password, salt);
        encryptionKeyRef.current = key;
        await saveKeyToSession(key);

        return data;
    };

    const logout = () => {
        api.logout();
        setUser(null);
        encryptionKeyRef.current = null;
        sessionStorage.removeItem(ENC_KEY_STORAGE);
    };

    const refreshUser = async () => {
        try {
            const data = await api.getProfile();
            setUser(data.data.user);
        } catch {
            // silent
        }
    };

    const getEncryptionKey = () => encryptionKeyRef.current;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, getEncryptionKey }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
