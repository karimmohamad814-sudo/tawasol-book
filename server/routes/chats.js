import express from 'express';
import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

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

// الحصول على المحادثات
router.get('/', authMiddleware, async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.userId })
            .populate('participants', 'name avatar status')
            .sort({ updatedAt: -1 });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// الحصول على محادثة معينة
router.get('/:chatId', authMiddleware, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'name avatar status');

        if (!chat) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إنشاء محادثة جديدة
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { participantId } = req.body;

        // البحث عن محادثة موجودة
        let chat = await Chat.findOne({
            participants: { $all: [req.userId, participantId] },
        });

        if (chat) {
            return res.json(chat);
        }

        // إنشاء محادثة جديدة
        chat = new Chat({
            participants: [req.userId, participantId],
            messages: [],
        });

        await chat.save();
        await chat.populate('participants', 'name avatar status');

        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// الحصول على الرسائل
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }

        res.json({ messages: chat.messages });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إرسال رسالة
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { text, attachments } = req.body;
        const chat = await Chat.findById(req.params.chatId);

        if (!chat) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }

        const message = {
            text,
            attachments: attachments || [],
            status: 'sent',
            createdAt: new Date(),
        };

        chat.messages.push(message);
        chat.lastMessage = text;
        chat.lastMessageTime = new Date();
        await chat.save();

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// حذف رسالة
router.delete('/:chatId/messages/:messageId', authMiddleware, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }

        chat.messages = chat.messages.filter(m => m._id.toString() !== req.params.messageId);
        await chat.save();

        res.json({ message: 'تم حذف الرسالة' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// وضع علامة قراءة
router.put('/:chatId/read', authMiddleware, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'المحادثة غير موجودة' });
        }

        chat.messages.forEach(msg => {
            if (msg.status !== 'read') {
                msg.status = 'read';
            }
        });
        await chat.save();

        res.json({ message: 'تم وضع علامة قراءة' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

export default router;
