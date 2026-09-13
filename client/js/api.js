// إدارة API والطلبات
class APIClient {
    constructor() {
        this.baseURL = config.API_URL;
        this.token = localStorage.getItem(config.TOKEN_KEY);
        this.timeout = config.REQUEST_TIMEOUT;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem(config.TOKEN_KEY, token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem(config.TOKEN_KEY);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method,
            headers: this.getHeaders(),
            ...options,
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                throw new APIError(
                    responseData.message || responseData.error || 'حدث خطأ غير متوقع',
                    response.status,
                    responseData
                );
            }

            return responseData;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(error.message || 'فشل الاتصال بالخادم', 0, error);
        }
    }

    // Methods للمصادقة
    async signup(userData) {
        return this.request('POST', '/api/auth/signup', userData);
    }

    async login(email, password) {
        return this.request('POST', '/api/auth/login', { email, password });
    }

    async logout() {
        try {
            await this.request('POST', '/api/auth/logout');
        } finally {
            this.clearToken();
        }
    }

    async refreshToken() {
        return this.request('POST', '/api/auth/refresh');
    }

    // Methods للمستخدم
    async getCurrentUser() {
        return this.request('GET', '/api/users/me');
    }

    async updateProfile(data) {
        return this.request('PUT', '/api/users/me', data);
    }

    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        return this.request('POST', '/api/users/avatar', null, {
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });
    }

    async searchUsers(query) {
        return this.request('GET', `/api/users/search?q=${encodeURIComponent(query)}`);
    }

    async getUserProfile(userId) {
        return this.request('GET', `/api/users/${userId}`);
    }

    // Methods للمحادثات
    async getChats() {
        return this.request('GET', '/api/chats');
    }

    async getChat(chatId) {
        return this.request('GET', `/api/chats/${chatId}`);
    }

    async createChat(userId) {
        return this.request('POST', '/api/chats', { participantId: userId });
    }

    async getMessages(chatId, page = 1) {
        return this.request('GET', `/api/chats/${chatId}/messages?page=${page}`);
    }

    async sendMessage(chatId, data) {
        return this.request('POST', `/api/chats/${chatId}/messages`, data);
    }

    async deleteMessage(chatId, messageId) {
        return this.request('DELETE', `/api/chats/${chatId}/messages/${messageId}`);
    }

    async markMessagesAsRead(chatId) {
        return this.request('PUT', `/api/chats/${chatId}/read`);
    }

    // Methods للجروبات
    async getGroups() {
        return this.request('GET', '/api/groups');
    }

    async getGroup(groupId) {
        return this.request('GET', `/api/groups/${groupId}`);
    }

    async createGroup(data) {
        return this.request('POST', '/api/groups', data);
    }

    async updateGroup(groupId, data) {
        return this.request('PUT', `/api/groups/${groupId}`, data);
    }

    async deleteGroup(groupId) {
        return this.request('DELETE', `/api/groups/${groupId}`);
    }

    async addGroupMembers(groupId, memberIds) {
        return this.request('POST', `/api/groups/${groupId}/members`, { memberIds });
    }

    async removeGroupMember(groupId, memberId) {
        return this.request('DELETE', `/api/groups/${groupId}/members/${memberId}`);
    }

    async getGroupMessages(groupId, page = 1) {
        return this.request('GET', `/api/groups/${groupId}/messages?page=${page}`);
    }

    async sendGroupMessage(groupId, data) {
        return this.request('POST', `/api/groups/${groupId}/messages`, data);
    }

    // Methods للمكالمات
    async initiateCal(data) {
        return this.request('POST', '/api/calls/initiate', data);
    }

    async acceptCall(callId) {
        return this.request('POST', `/api/calls/${callId}/accept`);
    }

    async rejectCall(callId) {
        return this.request('POST', `/api/calls/${callId}/reject`);
    }

    async endCall(callId) {
        return this.request('POST', `/api/calls/${callId}/end`);
    }
}

// فئة الأخطاء المخصصة
class APIError extends Error {
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// إنشاء نسخة عامة من العميل
const api = new APIClient();
