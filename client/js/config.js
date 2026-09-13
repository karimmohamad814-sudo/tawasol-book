// إعدادات التطبيق
const config = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://api.tawasol-book.com'
        : 'http://localhost:5000',
    
    SOCKET_URL: process.env.NODE_ENV === 'production'
        ? 'https://api.tawasol-book.com'
        : 'http://localhost:5000',
    
    // الإعدادات الأخرى
    APP_NAME: 'تواصل بوك',
    APP_VERSION: '2.0.0',
    STORAGE_PREFIX: 'tawasol_',
    TOKEN_KEY: 'tawasol_token',
    USER_KEY: 'tawasol_user',
    
    // المهلات الزمنية
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    // حدود البيانات
    PAGE_SIZE: 20,
    MAX_FILE_SIZE: 10485760, // 10MB
    
    // WebRTC
    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
    
    // الإشعارات
    NOTIFICATION_DURATION: 5000,
    
    // الحالات
    USER_STATUSES: {
        ONLINE: 'online',
        OFFLINE: 'offline',
        AWAY: 'away',
        BUSY: 'busy',
    },
    
    MESSAGE_STATUSES: {
        PENDING: 'pending',
        SENT: 'sent',
        DELIVERED: 'delivered',
        READ: 'read',
    },
    
    CALL_TYPES: {
        VOICE: 'voice',
        VIDEO: 'video',
    },
    
    CALL_STATUSES: {
        RINGING: 'ringing',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        ENDED: 'ended',
        MISSED: 'missed',
    },
};

// تصدير الإعدادات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
