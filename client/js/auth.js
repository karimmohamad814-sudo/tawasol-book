// نظام المصادقة والحسابات
class AuthManager {
    constructor() {
        this.user = storage.getUser();
        this.token = storage.getToken();
        this.isAuthenticated = !!this.token && !!this.user;
    }

    async signup(formData) {
        try {
            const response = await api.signup(formData);
            this.setUser(response.user);
            this.setToken(response.token);
            return response;
        } catch (error) {
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await api.login(email, password);
            this.setUser(response.user);
            this.setToken(response.token);
            return response;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await api.logout();
        } finally {
            this.clearAuth();
        }
    }

    async refreshToken() {
        try {
            const response = await api.refreshToken();
            this.setToken(response.token);
            return response;
        } catch (error) {
            this.clearAuth();
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const user = await api.getCurrentUser();
            this.setUser(user);
            return user;
        } catch (error) {
            throw error;
        }
    }

    async updateProfile(data) {
        try {
            const user = await api.updateProfile(data);
            this.setUser(user);
            return user;
        } catch (error) {
            throw error;
        }
    }

    async uploadAvatar(file) {
        try {
            const user = await api.uploadAvatar(file);
            this.setUser(user);
            return user;
        } catch (error) {
            throw error;
        }
    }

    setUser(user) {
        this.user = user;
        storage.saveUser(user);
    }

    setToken(token) {
        this.token = token;
        api.setToken(token);
        storage.saveToken(token);
    }

    clearAuth() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        api.clearToken();
        storage.clear();
    }

    isLoggedIn() {
        return this.isAuthenticated && this.token && this.user;
    }

    getCurrentUserId() {
        return this.user?._id;
    }

    getCurrentUserName() {
        return this.user?.name || this.user?.username || 'مستخدم';
    }
}

const auth = new AuthManager();
