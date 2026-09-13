// دوال مساعدة عامة
const Utils = {
    // تنسيق الوقت
    formatTime: (date) => {
        if (!date) return '';
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return 'اليوم';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'أمس';
        } else {
            return d.toLocaleDateString('ar-EG');
        }
    },

    formatDateTime: (date) => {
        return `${Utils.formatDate(date)} ${Utils.formatTime(date)}`;
    },

    // تنسيق المدة
    formatDuration: (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    // التحقق من الصحة
    isValidEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    isValidPhone: (phone) => {
        return /^[0-9+\-\s()]+$/.test(phone);
    },

    isValidUsername: (username) => {
        return /^[a-zA-Z0-9_\-]{3,20}$/.test(username);
    },

    // معالجة الملفات
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    getFileExtension: (filename) => {
        return filename.split('.').pop().toLowerCase();
    },

    // الألوان العشوائية
    getRandomColor: () => {
        const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // توليد الأحرف الأولى
    getInitials: (name) => {
        if (!name) return '؟';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },

    // نسخ إلى الحافظة
    copyToClipboard: async (text) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            return true;
        } catch (error) {
            console.error('فشل نسخ النص:', error);
            return false;
        }
    },

    // التأخير
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // توليد معرف فريد
    generateId: () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // تجميع الأرقام
    formatNumber: (num) => {
        return num.toLocaleString('ar-EG');
    },

    // التحقق من الحالة عبر الإنترنت
    isOnline: () => navigator.onLine,

    // الحصول على معلومات المتصفح
    getBrowserInfo: () => {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';

        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edge')) browser = 'Edge';

        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone')) os = 'iOS';
        else if (ua.includes('Linux')) os = 'Linux';

        return { browser, os };
    },

    // فتح رابط في نافذة جديدة
    openLink: (url, target = '_blank') => {
        window.open(url, target);
    },
};
