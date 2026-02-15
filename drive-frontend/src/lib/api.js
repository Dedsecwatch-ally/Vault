import { encryptFile, decryptFile } from './crypto';

class ApiClient {
    constructor() {
        // In production, call backend directly. In dev, use relative URLs (Next.js rewrites).
        // WARNING: If NEXT_PUBLIC_API_URL is set to localhost in production, this will fail.
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

        if (typeof window !== 'undefined') {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (!isLocal && this.baseUrl.includes('localhost')) {
                console.error('CRITICAL: App is deployed but configured to talk to localhost. Check NEXT_PUBLIC_API_URL.');
            }
            console.log('API Client initialized with Base URL:', this.baseUrl || '(relative)');
        }
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('vault_token');
        }
        return null;
    }

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('vault_token', token);
        }
    }

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('vault_token');
        }
    }

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = { ...options.headers };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const fullUrl = `${this.baseUrl}${endpoint}`;
        console.log(`📡 Requesting: ${options.method || 'GET'} ${fullUrl}`);

        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ API Error Response:', response.status, data);
                const error = new Error(data.message || 'Something went wrong');
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('🔥 Network/Fetch Error details:', error);
            console.error('Attempted URL:', fullUrl);
            throw error;
        }
    }

    // Auth
    async register(name, email, password, encryptionSalt) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, encryptionSalt }),
        });
        if (data.data?.token) this.setToken(data.data.token);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.data?.token) this.setToken(data.data.token);
        return data;
    }

    async getProfile() {
        return this.request('/api/auth/me');
    }

    // Files
    async listFiles(folderId = null, page = 1) {
        const params = new URLSearchParams({ page });
        if (folderId) params.append('folderId', folderId);
        return this.request(`/api/files?${params}`);
    }

    async uploadFiles(fileList, folderId = null, encryptionKey = null) {
        const formData = new FormData();

        // Handle both FileList and Array
        const files = fileList instanceof FileList || Array.isArray(fileList)
            ? Array.from(fileList)
            : [fileList];

        for (const file of files) {
            if (encryptionKey) {
                // Encrypt file content before upload
                const buffer = await file.arrayBuffer();
                const encrypted = await encryptFile(encryptionKey, buffer);
                const encryptedBlob = new Blob([encrypted], { type: file.type });
                const encryptedFile = new File([encryptedBlob], file.name, {
                    type: file.type,
                    lastModified: file.lastModified,
                });
                formData.append('files', encryptedFile);
            } else {
                formData.append('files', file);
            }
        }

        if (folderId) formData.append('folderId', folderId);
        if (encryptionKey) formData.append('isEncrypted', 'true');

        return this.request('/api/files/upload', {
            method: 'POST',
            body: formData,
        });
    }

    async downloadFile(fileId, encryptionKey = null, isEncrypted = false) {
        const token = this.getToken();
        const response = await fetch(`${this.baseUrl}/api/files/${fileId}/download`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            let msg = `Download failed (${response.status})`;
            try {
                const errData = await response.json();
                msg = errData.message || msg;
            } catch { }
            throw new Error(msg);
        }
        const blob = await response.blob();

        // Decrypt if the file was encrypted
        if (isEncrypted && encryptionKey) {
            const encryptedBuffer = await blob.arrayBuffer();
            const decryptedBuffer = await decryptFile(encryptionKey, encryptedBuffer);
            return new Blob([decryptedBuffer], { type: blob.type });
        }

        return blob;
    }

    async deleteFile(fileId) {
        return this.request(`/api/files/${fileId}`, { method: 'DELETE' });
    }

    async moveFile(fileId, folderId) {
        return this.request(`/api/files/${fileId}/move`, {
            method: 'POST',
            body: JSON.stringify({ folderId }),
        });
    }

    async getFileVersions(fileId) {
        return this.request(`/api/files/${fileId}/versions`);
    }

    async restoreVersion(fileId, versionId) {
        return this.request(`/api/files/${fileId}/versions/${versionId}/restore`, {
            method: 'POST',
        });
    }

    // Folders
    async listFolders(parentId = null) {
        const params = parentId ? `?parentId=${parentId}` : '';
        return this.request(`/api/folders${params}`);
    }

    async createFolder(name, parentId = null) {
        return this.request('/api/folders', {
            method: 'POST',
            body: JSON.stringify({ name, parentId }),
        });
    }

    async getFolderContents(folderId) {
        return this.request(`/api/folders/${folderId}/contents`);
    }

    async renameFolder(folderId, name) {
        return this.request(`/api/folders/${folderId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        });
    }

    async deleteFolder(folderId) {
        return this.request(`/api/folders/${folderId}`, { method: 'DELETE' });
    }

    async moveFolder(folderId, parentId) {
        return this.request(`/api/folders/${folderId}/move`, {
            method: 'POST',
            body: JSON.stringify({ parentId }),
        });
    }

    // Search
    async search(query, filters = {}) {
        const params = new URLSearchParams({ q: query, ...filters });
        return this.request(`/api/search?${params}`);
    }

    async getRecent() {
        return this.request('/api/search/recent');
    }

    async getQuota() {
        return this.request('/api/search/quota');
    }

    // Trash
    async listTrash() {
        return this.request('/api/trash');
    }

    async restoreFromTrash(id) {
        return this.request(`/api/trash/${id}/restore`, { method: 'POST' });
    }

    async permanentDelete(id) {
        return this.request(`/api/trash/${id}`, { method: 'DELETE' });
    }

    async emptyTrash() {
        return this.request('/api/trash/empty', { method: 'DELETE' });
    }

    // Sharing
    async shareWithUser(resourceType, resourceId, sharedWithEmail, permission) {
        return this.request('/api/shares', {
            method: 'POST',
            body: JSON.stringify({ resourceType, resourceId, email: sharedWithEmail, permission }),
        });
    }

    async createPublicLink(resourceType, resourceId, password = null, expiresAt = null) {
        return this.request('/api/shares/public', {
            method: 'POST',
            body: JSON.stringify({ resourceType, resourceId, password, expiresAt }),
        });
    }

    async listMyShares() {
        return this.request('/api/shares');
    }

    async listSharedWithMe() {
        return this.request('/api/shares/shared-with-me');
    }

    async revokeShare(shareId) {
        return this.request(`/api/shares/${shareId}`, { method: 'DELETE' });
    }

    // Logout
    logout() {
        this.removeToken();
    }
}

const api = new ApiClient();
export default api;
