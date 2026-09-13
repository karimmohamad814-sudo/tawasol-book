// إدارة الجروبات
class GroupManager {
    constructor() {
        this.groups = storage.getGroups();
        this.currentGroup = null;
        this.messages = {};
        this.socket = null;
    }

    async initialize(socket) {
        this.socket = socket;
        this.setupSocketListeners();
        await this.loadGroups();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('group:created', (data) => {
            this.addGroup(data.group);
        });

        this.socket.on('group:updated', (data) => {
            this.updateGroup(data.group);
        });

        this.socket.on('group:deleted', (data) => {
            this.removeGroup(data.groupId);
        });

        this.socket.on('group:message', (data) => {
            this.handleNewMessage(data);
        });

        this.socket.on('group:member-added', (data) => {
            this.handleMemberAdded(data);
        });

        this.socket.on('group:member-removed', (data) => {
            this.handleMemberRemoved(data);
        });
    }

    async loadGroups() {
        try {
            this.groups = await api.getGroups();
            storage.saveGroups(this.groups);
            return this.groups;
        } catch (error) {
            console.error('فشل تحميل الجروبات:', error);
            return [];
        }
    }

    async createGroup(data) {
        try {
            const group = await api.createGroup(data);
            this.groups.push(group);
            storage.saveGroups(this.groups);
            return group;
        } catch (error) {
            console.error('فشل إنشاء الجروب:', error);
            throw error;
        }
    }

    async updateGroup(groupId, data) {
        try {
            const group = await api.updateGroup(groupId, data);
            const index = this.groups.findIndex(g => g._id === groupId);
            if (index !== -1) {
                this.groups[index] = group;
                storage.saveGroups(this.groups);
            }
            return group;
        } catch (error) {
            console.error('فشل تحديث الجروب:', error);
            throw error;
        }
    }

    async deleteGroup(groupId) {
        try {
            await api.deleteGroup(groupId);
            this.removeGroup(groupId);
        } catch (error) {
            console.error('فشل حذف الجروب:', error);
            throw error;
        }
    }

    async openGroup(groupId) {
        try {
            const group = await api.getGroup(groupId);
            this.currentGroup = group;
            await this.loadMessages(groupId);
            return group;
        } catch (error) {
            console.error('فشل فتح الجروب:', error);
            throw error;
        }
    }

    async loadMessages(groupId, page = 1) {
        try {
            const response = await api.getGroupMessages(groupId, page);
            this.messages[groupId] = response.messages || [];
            storage.saveMessages(groupId, this.messages[groupId]);
            return this.messages[groupId];
        } catch (error) {
            console.error('فشل تحميل رسائل الجروب:', error);
            return [];
        }
    }

    async sendMessage(groupId, text, attachments = []) {
        try {
            const message = await api.sendGroupMessage(groupId, {
                text,
                attachments,
            });

            if (!this.messages[groupId]) {
                this.messages[groupId] = [];
            }

            this.messages[groupId].push(message);
            storage.saveMessages(groupId, this.messages[groupId]);

            return message;
        } catch (error) {
            console.error('فشل إرسال الرسالة:', error);
            throw error;
        }
    }

    async addMembers(groupId, memberIds) {
        try {
            const group = await api.addGroupMembers(groupId, memberIds);
            const index = this.groups.findIndex(g => g._id === groupId);
            if (index !== -1) {
                this.groups[index] = group;
            }
            return group;
        } catch (error) {
            console.error('فشل إضافة الأعضاء:', error);
            throw error;
        }
    }

    async removeMember(groupId, memberId) {
        try {
            const group = await api.removeGroupMember(groupId, memberId);
            const index = this.groups.findIndex(g => g._id === groupId);
            if (index !== -1) {
                this.groups[index] = group;
            }
            return group;
        } catch (error) {
            console.error('فشل حذف العضو:', error);
            throw error;
        }
    }

    handleNewMessage(data) {
        const { groupId, message } = data;
        
        if (!this.messages[groupId]) {
            this.messages[groupId] = [];
        }

        this.messages[groupId].push(message);
        storage.saveMessages(groupId, this.messages[groupId]);

        Notifications.playNotificationSound();
        Notifications.showNotification(`رسالة جديدة في ${message.groupName}`);
    }

    handleMemberAdded(data) {
        const { groupId, member } = data;
        const group = this.groups.find(g => g._id === groupId);
        if (group) {
            group.members.push(member);
            storage.saveGroups(this.groups);
        }
    }

    handleMemberRemoved(data) {
        const { groupId, memberId } = data;
        const group = this.groups.find(g => g._id === groupId);
        if (group) {
            group.members = group.members.filter(m => m._id !== memberId);
            storage.saveGroups(this.groups);
        }
    }

    addGroup(group) {
        if (!this.groups.find(g => g._id === group._id)) {
            this.groups.unshift(group);
            storage.saveGroups(this.groups);
        }
    }

    updateGroup(group) {
        const index = this.groups.findIndex(g => g._id === group._id);
        if (index !== -1) {
            this.groups[index] = group;
            storage.saveGroups(this.groups);
        }
    }

    removeGroup(groupId) {
        this.groups = this.groups.filter(g => g._id !== groupId);
        storage.saveGroups(this.groups);
    }

    getGroups() {
        return this.groups;
    }

    getGroup(groupId) {
        return this.groups.find(g => g._id === groupId);
    }

    getMessages(groupId) {
        return this.messages[groupId] || [];
    }
}

const groups = new GroupManager();
