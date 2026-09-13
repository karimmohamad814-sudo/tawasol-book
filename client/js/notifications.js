// نظام الإشعارات والتنبيهات
class NotificationManager {
    constructor() {
        this.isEnabled = true;
        this.soundEnabled = true;
        this.vibrateEnabled = true;
        this.requestPermission();
    }

    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    showNotification(title, options = {}) {
        if (!this.isEnabled) return;

        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22%3E%3Crect width=%22192%22 height=%22192%22 fill=%22%237c3aed%22/%3E%3Ctext x=%2296%22 y=%22140%22 font-size=%22140%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22%3ETS%3C/text%3E%3C/svg%3E',
                badge: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22%3E%3Crect width=%22192%22 height=%22192%22 fill=%22%237c3aed%22 rx=%2245%22/%3E%3Ctext x=%2296%22 y=%22140%22 font-size=%22140%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22%3ETS%3C/text%3E%3C/svg%3E',
                tag: 'tawasol-notification',
                requireInteraction: false,
                ...options,
            });

            notification.addEventListener('click', () => {
                window.focus();
                notification.close();
            });
        }
    }

    playNotificationSound() {
        if (!this.soundEnabled) return;

        const audio = document.getElementById('notification-sound');
        if (audio) {
            // استخدام نغمة بسيطة
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    vibrate(pattern = [200]) {
        if (!this.vibrateEnabled || !navigator.vibrate) return;
        navigator.vibrate(pattern);
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setVibrateEnabled(enabled) {
        this.vibrateEnabled = enabled;
    }
}

const Notifications = new NotificationManager();
