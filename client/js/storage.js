// إدارة التخزين المحلي
class StorageManager {
    constructor(prefix = config.STORAGE_PREFIX) {
        this.prefix = prefix;
    }

    getKey(key) {
        return `${this.prefix}${key}`;
    }

    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serialized);
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('خطأ في حذف البيانات:', error);
            return false;
        }
    }

    clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('خطأ في مسح البيانات:', error);
            return false;
        }
    }

    // Methods محددة
    saveUser(user) {
        return this.set('user', user);
    }

    getUser() {
        return this.get('user');
    }

    saveToken(token) {
        return this.set('token', token);
    }

    getToken() {
        return this.get('token');
    }

    saveChats(chats) {
        return this.set('chats', chats);
    }

    getChats() {
        return this.get('chats', []);
    }

    saveMessages(chatId, messages) {
        return this.set(`messages_${chatId}`, messages);
    }

    getMessages(chatId) {
        return this.get(`messages_${chatId}`, []);
    }

    saveGroups(groups) {
        return this.set('groups', groups);
    }

    getGroups() {
        return this.get('groups', []);
    }

    saveSettings(settings) {
        return this.set('settings', settings);
    }

    getSettings() {
        return this.get('settings', {});
    }
}

// إنشاء نسخة عامة
const storage = new StorageManager();
