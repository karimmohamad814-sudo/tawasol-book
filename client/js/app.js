// تطبيق تواصل بوك - نقطة الدخول الرئيسية
class TawasalBookApp {
    constructor() {
        this.socket = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            ui.showLoader('جاري تحميل التطبيق...');

            // التحقق من المصادقة
            if (!auth.isLoggedIn()) {
                this.showAuthScreen();
                ui.hideLoader();
                return;
            }

            // التحقق من صلاحية التوكن
            try {
                const user = await auth.getCurrentUser();
                auth.setUser(user);
            } catch (error) {
                console.warn('فشل التحقق من المستخدم:', error);
                this.showAuthScreen();
                ui.hideLoader();
                return;
            }

            // إنشاء اتصال Socket.io
            this.socket = io(config.SOCKET_URL, {
                auth: {
                    token: auth.token,
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            });

            this.setupSocketListeners();

            // تهيئة المديرين
            await chat.initialize(this.socket);
            await calls.initialize(this.socket);
            await groups.initialize(this.socket);

            // عرض لوحة التحكم
            this.showDashboard();
            this.isInitialized = true;
            ui.hideLoader();
        } catch (error) {
            console.error('فشل تهيئة التطبيق:', error);
            ui.showError('فشل تحميل التطبيق');
            ui.hideLoader();
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ تم الاتصال بالخادم');
            ui.showSuccess('متصل بالخادم');
        });

        this.socket.on('disconnect', () => {
            console.warn('⚠️ قطع الاتصال بالخادم');
            ui.showWarning('تم قطع الاتصال');
        });

        this.socket.on('error', (error) => {
            console.error('❌ خطأ في Socket:', error);
            ui.showError(error.message || 'حدث خطأ');
        });

        this.socket.on('user:status', (data) => {
            // تحديث حالة المستخدم
            if (window.onUserStatusChange) {
                window.onUserStatusChange(data);
            }
        });
    }

    showAuthScreen() {
        const container = ui.screensContainer;
        container.innerHTML = `
            <div class="auth-screen">
                <div class="auth-container">
                    <div class="auth-header">
                        <div class="auth-logo">TS</div>
                        <h1 class="auth-title">تواصل بوك</h1>
                        <p class="auth-subtitle">تطبيق التواصل الفوري العربي</p>
                    </div>
                    <div id="auth-content"></div>
                </div>
            </div>
        `;

        this.showLoginForm();
    }

    showLoginForm() {
        const authContent = document.getElementById('auth-content');
        authContent.innerHTML = `
            <form class="auth-form" id="login-form">
                <h2 style="text-align: center; margin-bottom: 1.5rem; color: #1f2937;">تسجيل الدخول</h2>
                
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="login-email" required placeholder="example@email.com">
                </div>

                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" id="login-password" required placeholder="••••••••">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">دخول</button>

                <div class="auth-toggle">
                    ليس لديك حساب؟ <button type="button" class="btn btn-ghost" onclick="app.showSignupForm()">إنشاء حساب جديد</button>
                </div>
            </form>
        `;

        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    showSignupForm() {
        const authContent = document.getElementById('auth-content');
        authContent.innerHTML = `
            <form class="auth-form" id="signup-form">
                <h2 style="text-align: center; margin-bottom: 1.5rem; color: #1f2937;">إنشاء حساب جديد</h2>
                
                <div class="form-group">
                    <label>الاسم الكامل</label>
                    <input type="text" id="signup-name" required placeholder="اسمك الكامل">
                </div>

                <div class="form-group">
                    <label>اسم المستخدم</label>
                    <input type="text" id="signup-username" required placeholder="اسم فريد">
                </div>

                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" id="signup-email" required placeholder="example@email.com">
                </div>

                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" id="signup-password" required placeholder="••••••••" minlength="6">
                </div>

                <div class="form-group">
                    <label>تأكيد كلمة المرور</label>
                    <input type="password" id="signup-confirm" required placeholder="••••••••" minlength="6">
                </div>

                <div class="form-group">
                    <label>صورة شخصية</label>
                    <div class="file-input-wrapper">
                        <input type="file" id="signup-avatar" accept="image/*">
                        <label class="file-input-label">📸 اختر صورة</label>
                    </div>
                    <img id="avatar-preview" class="file-preview hidden">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;">إنشاء حساب</button>

                <div class="auth-toggle">
                    لديك حساب بالفعل؟ <button type="button" class="btn btn-ghost" onclick="app.showLoginForm()">دخول</button>
                </div>
            </form>
        `;

        // معاينة الصورة
        const avatarInput = document.getElementById('signup-avatar');
        const preview = document.getElementById('avatar-preview');
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        const form = document.getElementById('signup-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSignup();
        });
    }

    async handleLogin() {
        try {
            ui.showLoader('جاري تسجيل الدخول...');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            await auth.login(email, password);
            ui.hideLoader();
            await this.initialize();
        } catch (error) {
            ui.hideLoader();
            ui.showError(error.message || 'فشل تسجيل الدخول');
        }
    }

    async handleSignup() {
        try {
            ui.showLoader('جاري إنشاء الحساب...');

            const name = document.getElementById('signup-name').value;
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            const avatarFile = document.getElementById('signup-avatar').files[0];

            if (password !== confirm) {
                throw new Error('كلمات المرور غير متطابقة');
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await fetch(`${config.API_URL}/api/auth/signup`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            auth.setUser(data.user);
            auth.setToken(data.token);

            ui.hideLoader();
            ui.showSuccess('تم إنشاء الحساب بنجاح!');
            await this.initialize();
        } catch (error) {
            ui.hideLoader();
            ui.showError(error.message || 'فشل إنشاء الحساب');
        }
    }

    showDashboard() {
        const container = ui.screensContainer;
        container.innerHTML = `
            <div class="dashboard-screen">
                <div class="dashboard-header">
                    <div class="dashboard-logo">TS تواصل بوك</div>
                    <div class="dashboard-nav" id="nav-tabs">
                        <button class="nav-tab active" data-tab="chats">المحادثات</button>
                        <button class="nav-tab" data-tab="contacts">جهات الاتصال</button>
                        <button class="nav-tab" data-tab="groups">الجروبات</button>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-icon" title="إنشاء محادثة" onclick="app.showNewChatModal()">➕</button>
                        <button class="btn btn-icon" title="الملف الشخصي" onclick="app.showProfileModal()">👤</button>
                        <button class="btn btn-icon" title="تسجيل الخروج" onclick="app.logout()">🚪</button>
                    </div>
                </div>
                <div class="dashboard-content">
                    <div class="sidebar" id="sidebar">
                        <div class="sidebar-section active" data-section="chats" style="display: flex; flex-direction: column;">
                            <div class="sidebar-header">المحادثات</div>
                            <div id="chats-list" class="contacts-list"></div>
                        </div>
                        <div class="sidebar-section" data-section="contacts" style="display: none; flex-direction: column;">
                            <div class="sidebar-header">جهات الاتصال</div>
                            <div id="contacts-list" class="contacts-list"></div>
                        </div>
                        <div class="sidebar-section" data-section="groups" style="display: none; flex-direction: column;">
                            <div class="sidebar-header">الجروبات</div>
                            <div id="groups-list" class="contacts-list"></div>
                        </div>
                    </div>
                    <div class="main-content">
                        <div id="chat-view" style="display: flex; flex-direction: column; height: 100%;">
                            <div class="empty-state">
                                <div class="empty-state-icon">💬</div>
                                <div class="empty-state-title">اختر محادثة للبدء</div>
                                <div class="empty-state-description">اختر محادثة من القائمة أو ابدأ محادثة جديدة</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupTabNavigation();
        this.loadChatsView();
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        const sections = document.querySelectorAll('.sidebar-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                sections.forEach(s => s.style.display = 'none');
                const section = document.querySelector(`[data-section="${tabName}"]`);
                if (section) section.style.display = 'flex';

                if (tabName === 'chats') this.loadChatsView();
                else if (tabName === 'contacts') this.loadContactsView();
                else if (tabName === 'groups') this.loadGroupsView();
            });
        });
    }

    loadChatsView() {
        const list = document.getElementById('chats-list');
        if (!list) return;

        if (chat.chats.length === 0) {
            list.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6b7280;">لا توجد محادثات</div>';
            return;
        }

        list.innerHTML = chat.chats.map(c => `
            <div class="list-item" onclick="app.openChat('${c._id}')">
                <div class="list-item-avatar">${Utils.getInitials(c.participantName)}</div>
                <div class="list-item-info">
                    <div class="list-item-name">${c.participantName}</div>
                    <div class="list-item-status">${c.lastMessage || 'ابدأ محادثة'}</div>
                </div>
            </div>
        `).join('');
    }

    loadContactsView() {
        const list = document.getElementById('contacts-list');
        if (!list) return;
        list.innerHTML = '<div style="padding: 1rem;"><input type="text" id="search-contacts" placeholder="ابحث عن جهات اتصال..." style="width: 100%; padding: 10px;"><div id="search-results" style="margin-top: 1rem;"></div></div>';
    }

    loadGroupsView() {
        const list = document.getElementById('groups-list');
        if (!list) return;

        if (groups.groups.length === 0) {
            list.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6b7280;">لا توجد جروبات</div>';
            return;
        }

        list.innerHTML = groups.groups.map(g => `
            <div class="list-item" onclick="app.openGroup('${g._id}')">
                <div class="list-item-avatar">${Utils.getInitials(g.name)}</div>
                <div class="list-item-info">
                    <div class="list-item-name">${g.name}</div>
                    <div class="list-item-status">${g.members.length} أعضاء</div>
                </div>
            </div>
        `).join('');
    }

    async openChat(chatId) {
        try {
            ui.showLoader();
            const c = await chat.openChat(chatId);
            ui.hideLoader();
            this.showChatView(c);
        } catch (error) {
            ui.hideLoader();
            ui.showError(error.message);
        }
    }

    showChatView(c) {
        const chatView = document.getElementById('chat-view');
        const messages = chat.getMessages(c._id);

        chatView.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-header-avatar">${Utils.getInitials(c.participantName)}</div>
                    <div class="chat-header-details">
                        <h3>${c.participantName}</h3>
                        <p>متصل</p>
                    </div>
                </div>
                <div class="chat-header-actions">
                    <button class="btn btn-icon" onclick="app.initiateCall('${c._id}', 'voice')">📞</button>
                    <button class="btn btn-icon" onclick="app.initiateCall('${c._id}', 'video')">📹</button>
                </div>
            </div>
            <div class="chat-content" id="messages-list">
                ${messages.map(msg => `
                    <div class="message ${msg.senderId === auth.getCurrentUserId() ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <div class="message-content">${msg.text}</div>
                            <div class="message-meta">${Utils.formatTime(msg.createdAt)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input">
                <button class="btn btn-icon" title="إضافة ملف">📎</button>
                <textarea id="message-input" placeholder="اكتب رسالتك..." style="flex: 1;"></textarea>
                <button class="btn btn-send" onclick="app.sendMessage('${c._id}')">➤</button>
            </div>
        `;

        const messagesList = document.getElementById('messages-list');
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    async sendMessage(chatId) {
        try {
            const input = document.getElementById('message-input');
            const text = input.value.trim();

            if (!text) return;

            await chat.sendMessage(chatId, text);
            input.value = '';
            this.showChatView(chat.getChat(chatId));
        } catch (error) {
            ui.showError(error.message);
        }
    }

    async openGroup(groupId) {
        try {
            ui.showLoader();
            const g = await groups.openGroup(groupId);
            ui.hideLoader();
            this.showGroupView(g);
        } catch (error) {
            ui.hideLoader();
            ui.showError(error.message);
        }
    }

    showGroupView(g) {
        const chatView = document.getElementById('chat-view');
        const messages = groups.getMessages(g._id);

        chatView.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-header-avatar">${Utils.getInitials(g.name)}</div>
                    <div class="chat-header-details">
                        <h3>${g.name}</h3>
                        <p>${g.members.length} أعضاء</p>
                    </div>
                </div>
                <div class="chat-header-actions">
                    <button class="btn btn-icon" onclick="app.showGroupSettings('${g._id}')">⚙️</button>
                </div>
            </div>
            <div class="chat-content" id="messages-list">
                ${messages.map(msg => `
                    <div class="message ${msg.senderId === auth.getCurrentUserId() ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px;">${msg.senderName}</div>
                            <div class="message-content">${msg.text}</div>
                            <div class="message-meta">${Utils.formatTime(msg.createdAt)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input">
                <button class="btn btn-icon" title="إضافة ملف">📎</button>
                <textarea id="message-input" placeholder="اكتب رسالتك..." style="flex: 1;"></textarea>
                <button class="btn btn-send" onclick="app.sendGroupMessage('${g._id}')">➤</button>
            </div>
        `;

        const messagesList = document.getElementById('messages-list');
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    async sendGroupMessage(groupId) {
        try {
            const input = document.getElementById('message-input');
            const text = input.value.trim();

            if (!text) return;

            await groups.sendMessage(groupId, text);
            input.value = '';
            this.showGroupView(groups.getGroup(groupId));
        } catch (error) {
            ui.showError(error.message);
        }
    }

    showNewChatModal() {
        ui.showModal('محادثة جديدة', `
            <div class="form-group">
                <label>ابحث عن مستخدم</label>
                <input type="text" id="new-chat-search" placeholder="اكتب اسم المستخدم...">
            </div>
            <div id="search-results" style="margin-top: 1rem;"></div>
        `, {
            footer: `<button class="btn btn-secondary" onclick="ui.closeLastModal()">إلغاء</button>`,
        });
    }

    showGroupSettings(groupId) {
        ui.showModal('إعدادات الجروب', '<p>إعدادات الجروب قريباً</p>');
    }

    showProfileModal() {
        const user = auth.user;
        ui.showModal('الملف الشخصي', `
            <div style="text-align: center;">
                <div class="list-item-avatar" style="width: 80px; height: 80px; margin: 0 auto 1rem;">${Utils.getInitials(user.name)}</div>
                <h3 style="margin-bottom: 0.5rem;">${user.name}</h3>
                <p style="color: #6b7280; margin-bottom: 1rem;">@${user.username}</p>
                <p style="color: #6b7280;">${user.email}</p>
            </div>
        `, {
            footer: `
                <button class="btn btn-secondary" onclick="ui.closeLastModal()">إغلاق</button>
                <button class="btn btn-primary" onclick="app.logout()">تسجيل الخروج</button>
            `,
        });
    }

    initiateCall(chatId, type) {
        const c = chat.getChat(chatId);
        if (!c) return;
        ui.showInfo(`جاري بدء مكالمة ${type === 'voice' ? 'صوتية' : 'فيديو'}...`);
    }

    async logout() {
        try {
            await auth.logout();
            location.reload();
        } catch (error) {
            ui.showError(error.message);
        }
    }
}

// إنشاء نسخة من التطبيق
const app = new TawasalBookApp();

// تهيئة التطبيق عند تحميل الصفحة
window.addEventListener('load', () => {
    app.initialize();
});
