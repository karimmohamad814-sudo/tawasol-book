import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware للتحقق من الحساب
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'لم يتم توفير توكن' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'توكن غير صحيح' });
    }
};

// الحصول على بيانات المستخدم الحالي
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// تحديث ملف المستخدم
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { name, bio, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.userId,
            { name, bio, phone, updatedAt: new Date() },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// البحث عن المستخدمين
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ],
        }).select('-password').limit(20);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// الحصول على ملف المستخدم
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// تحميل الصورة الشخصية
router.post('/avatar', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.userId,
            { avatar: req.body.avatar },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

export default router;
