// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker مسجل بنجاح:', registration);
            })
            .catch(error => {
                console.warn('⚠️ فشل تسجيل Service Worker:', error);
            });
    });
}

// معالجة الاتصال بلا إنترنت
window.addEventListener('offline', () => {
    if (ui) ui.showWarning('تم قطع الاتصال بالإنترنت');
});

window.addEventListener('online', () => {
    if (ui) ui.showSuccess('تم استعادة الاتصال بالإنترنت');
});
