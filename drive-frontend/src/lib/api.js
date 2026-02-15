class ApiClient {
    constructor() {
        // In production, call backend directly. In dev, use relative URLs (Next.js rewrites).
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
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

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Something went wrong');
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // Auth
    async register(name, email, password) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
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

    async uploadFiles(fileList, folderId = null) {
        const formData = new FormData();

        // Handle both FileList and Array
        if (fileList instanceof FileList || Array.isArray(fileList)) {
            Array.from(fileList).forEach(file => {
                formData.append('files', file);
            });
        } else {
            // Single file fallback
            formData.append('files', fileList);
        }

        if (folderId) formData.append('folderId', folderId);

        return this.request('/api/files/upload', {
            method: 'POST',
            body: formData,
        });
    }

    async downloadFile(fileId) {
        const token = this.getToken();
        const response = await fetch(`${this.baseUrl}/api/files/${fileId}/download`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
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
            body: JSON.stringify({ resourceType, resourceId, sharedWithEmail, permission }),
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
