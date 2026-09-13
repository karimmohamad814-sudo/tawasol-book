import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// تسجيل
router.post('/signup', async (req, res) => {
    try {
        const { name, username, email, password, avatar } = req.body;

        // التحقق من وجود المستخدم
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'المستخدم موجود بالفعل' });
        }

        // إنشاء مستخدم جديد
        const user = new User({
            name,
            username,
            email,
            password,
            avatar: avatar || null,
        });

        await user.save();

        // إنشاء token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'تم إنشاء الحساب بنجاح',
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'بيانات المصادقة غير صحيحة' });
        }

        // التحقق من كلمة المرور
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'بيانات المصادقة غير صحيحة' });
        }

        // إنشاء token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // تحديث حالة المستخدم
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
    res.json({ message: 'تم تسجيل الخروج بنجاح' });
});

// تحديث التوكن
router.post('/refresh', (req, res) => {
    res.json({ token: 'new_token' });
});

export default router;
