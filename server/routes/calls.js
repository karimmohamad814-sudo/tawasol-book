import express from 'express';
import jwt from 'jsonwebtoken';
import Call from '../models/Call.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'لم يتم توفير توكن' });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'توكن غير صحيح' });
    }
};

// بدء مكالمة
router.post('/initiate', authMiddleware, async (req, res) => {
    try {
        const { recipientId, type } = req.body;

        const call = new Call({
            caller: req.userId,
            recipient: recipientId,
            type,
            status: 'ringing',
            startTime: new Date(),
        });

        await call.save();
        await call.populate('caller', 'name');
        await call.populate('recipient', 'name');

        res.status(201).json(call);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// قبول المكالمة
router.post('/:callId/accept', authMiddleware, async (req, res) => {
    try {
        const call = await Call.findById(req.params.callId);
        if (!call) {
            return res.status(404).json({ message: 'المكالمة غير موجودة' });
        }

        call.status = 'accepted';
        await call.save();

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// رفض المكالمة
router.post('/:callId/reject', authMiddleware, async (req, res) => {
    try {
        const call = await Call.findById(req.params.callId);
        if (!call) {
            return res.status(404).json({ message: 'المكالمة غير موجودة' });
        }

        call.status = 'rejected';
        call.endTime = new Date();
        await call.save();

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إنهاء المكالمة
router.post('/:callId/end', authMiddleware, async (req, res) => {
    try {
        const call = await Call.findById(req.params.callId);
        if (!call) {
            return res.status(404).json({ message: 'المكالمة غير موجودة' });
        }

        call.status = 'ended';
        call.endTime = new Date();
        call.duration = Math.floor((call.endTime - call.startTime) / 1000);
        await call.save();

        res.json(call);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

export default router;
