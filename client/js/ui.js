// إدارة واجهة المستخدم والشاشات
class UIManager {
    constructor() {
        this.currentScreen = null;
        this.screens = {};
        this.modals = [];
        this.init();
    }

    init() {
        this.loadingElement = document.getElementById('loader');
        this.screensContainer = document.getElementById('screens-container');
        this.modalContainer = document.getElementById('modal-container');
    }

    showScreen(screenName, data = {}) {
        // حفظ الشاشة الحالية
        if (this.currentScreen) {
            this.screens[this.currentScreen]?.hide?.();
        }

        // عرض الشاشة الجديدة
        this.currentScreen = screenName;
        const screen = this.screens[screenName];
        if (screen) {
            screen.show(data);
        }
    }

    hideLoader() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showLoader(message = 'جاري التحميل...') {
        if (this.loadingElement) {
            this.loadingElement.innerHTML = `
                <div class="loader-content">
                    <div class="loader-logo">TS</div>
                    <p>${message}</p>
                </div>
            `;
            this.loadingElement.style.display = 'flex';
        }
    }

    showModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="card-header">
                    <h3 class="card-title">${title}</h3>
                </div>
                <div class="card-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="card-footer">${options.footer}</div>` : ''}
            </div>
        `;

        if (options.onClose) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    options.onClose();
                }
            });
        } else {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }

        this.modalContainer.appendChild(modal);
        this.modals.push(modal);
    }

    closeLastModal() {
        const modal = this.modals.pop();
        if (modal) {
            modal.remove();
        }
    }

    showNotification(message, type = 'info', duration = config.NOTIFICATION_DURATION) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
        `;

        this.modalContainer.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, duration);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger', 8000);
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showConfirm(message, onConfirm, onCancel) {
        const content = `
            <p>${message}</p>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">إلغاء</button>
            <button class="btn btn-danger" id="confirm-btn">تأكيد</button>
        `;

        this.showModal('تأكيد', content, { footer });

        const confirmBtn = document.getElementById('confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.closeLastModal();
                onConfirm();
            });
        }
    }

    formatUserStatus(status) {
        const statuses = {
            'online': { text: 'متصل', icon: '🟢', color: '#10b981' },
            'offline': { text: 'غير متصل', icon: '⚫', color: '#6b7280' },
            'away': { text: 'بعيد', icon: '🟡', color: '#f59e0b' },
            'busy': { text: 'مشغول', icon: '🔴', color: '#ef4444' },
        };
        return statuses[status] || statuses.offline;
    }
}

const ui = new UIManager();
