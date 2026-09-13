// إدارة المحادثات الفردية
class ChatManager {
    constructor() {
        this.currentChat = null;
        this.chats = storage.getChats();
        this.messages = {};
        this.socket = null;
        this.typingTimeout = null;
    }

    async initialize(socket) {
        this.socket = socket;
        this.setupSocketListeners();
        await this.loadChats();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('message:new', (data) => {
            this.handleNewMessage(data);
        });

        this.socket.on('message:read', (data) => {
            this.handleMessageRead(data);
        });

        this.socket.on('user:typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('chat:created', (data) => {
            this.addChat(data);
        });
    }

    async loadChats() {
        try {
            this.chats = await api.getChats();
            storage.saveChats(this.chats);
            return this.chats;
        } catch (error) {
            console.error('فشل تحميل المحادثات:', error);
            return [];
        }
    }

    async openChat(userId) {
        try {
            let chat = this.chats.find(c => c.participantId === userId);
            
            if (!chat) {
                chat = await api.createChat(userId);
                this.chats.push(chat);
                storage.saveChats(this.chats);
            }

            this.currentChat = chat;
            await this.loadMessages(chat._id);
            await this.markAsRead(chat._id);

            return chat;
        } catch (error) {
            console.error('فشل فتح المحادثة:', error);
            throw error;
        }
    }

    async loadMessages(chatId, page = 1) {
        try {
            const response = await api.getMessages(chatId, page);
            this.messages[chatId] = response.messages || [];
            storage.saveMessages(chatId, this.messages[chatId]);
            return this.messages[chatId];
        } catch (error) {
            console.error('فشل تحميل الرسائل:', error);
            return [];
        }
    }

    async sendMessage(chatId, text, attachments = []) {
        try {
            const message = await api.sendMessage(chatId, {
                text,
                attachments,
            });

            if (!this.messages[chatId]) {
                this.messages[chatId] = [];
            }

            this.messages[chatId].push(message);
            storage.saveMessages(chatId, this.messages[chatId]);

            return message;
        } catch (error) {
            console.error('فشل إرسال الرسالة:', error);
            throw error;
        }
    }

    async deleteMessage(chatId, messageId) {
        try {
            await api.deleteMessage(chatId, messageId);
            
            if (this.messages[chatId]) {
                this.messages[chatId] = this.messages[chatId].filter(m => m._id !== messageId);
                storage.saveMessages(chatId, this.messages[chatId]);
            }
        } catch (error) {
            console.error('فشل حذف الرسالة:', error);
            throw error;
        }
    }

    async markAsRead(chatId) {
        try {
            await api.markMessagesAsRead(chatId);
        } catch (error) {
            console.error('فشل تحديث حالة القراءة:', error);
        }
    }

    notifyTyping(chatId) {
        if (this.socket) {
            this.socket.emit('user:typing', { chatId });
        }

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.typingTimeout = setTimeout(() => {
            if (this.socket) {
                this.socket.emit('user:typing', { chatId, typing: false });
            }
        }, 3000);
    }

    handleNewMessage(data) {
        const { chatId, message } = data;
        
        if (!this.messages[chatId]) {
            this.messages[chatId] = [];
        }

        this.messages[chatId].push(message);
        storage.saveMessages(chatId, this.messages[chatId]);

        // تشغيل صوت الإشعار
        Notifications.playNotificationSound();
        
        // عرض إشعار
        Notifications.showNotification(`رسالة جديدة من ${message.senderName}`);
    }

    handleMessageRead(data) {
        const { chatId, messageId } = data;
        if (this.messages[chatId]) {
            const message = this.messages[chatId].find(m => m._id === messageId);
            if (message) {
                message.status = config.MESSAGE_STATUSES.READ;
            }
        }
    }

    handleUserTyping(data) {
        const { chatId, typing } = data;
        // سيتم التعامل معه في واجهة المستخدم
        if (this.onTypingChange) {
            this.onTypingChange(chatId, typing);
        }
    }

    addChat(chat) {
        if (!this.chats.find(c => c._id === chat._id)) {
            this.chats.unshift(chat);
            storage.saveChats(this.chats);
        }
    }

    getChat(chatId) {
        return this.chats.find(c => c._id === chatId);
    }

    getMessages(chatId) {
        return this.messages[chatId] || [];
    }
}

const chat = new ChatManager();
