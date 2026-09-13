import express from 'express';
import jwt from 'jsonwebtoken';
import Group from '../models/Group.js';

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

// الحصول على الجروبات
router.get('/', authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.userId })
            .populate('admin', 'name')
            .populate('members', 'name avatar')
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// الحصول على جروب معين
router.get('/:groupId', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('admin', 'name')
            .populate('members', 'name avatar');

        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إنشاء جروب
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, members } = req.body;

        const group = new Group({
            name,
            description,
            admin: req.userId,
            members: [req.userId, ...members],
            messages: [],
        });

        await group.save();
        await group.populate('admin', 'name');
        await group.populate('members', 'name avatar');

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// تحديث الجروب
router.put('/:groupId', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        if (group.admin.toString() !== req.userId) {
            return res.status(403).json({ message: 'ليس لديك صلاحيات' });
        }

        const { name, description, avatar } = req.body;
        group.name = name || group.name;
        group.description = description || group.description;
        group.avatar = avatar || group.avatar;
        group.updatedAt = new Date();

        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// حذف الجروب
router.delete('/:groupId', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        if (group.admin.toString() !== req.userId) {
            return res.status(403).json({ message: 'ليس لديك صلاحيات' });
        }

        await Group.deleteOne({ _id: req.params.groupId });
        res.json({ message: 'تم حذف الجروب' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إضافة أعضاء
router.post('/:groupId/members', authMiddleware, async (req, res) => {
    try {
        const { memberIds } = req.body;
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        if (group.admin.toString() !== req.userId) {
            return res.status(403).json({ message: 'ليس لديك صلاحيات' });
        }

        group.members = [...new Set([...group.members, ...memberIds])];
        await group.save();
        await group.populate('members', 'name avatar');

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إزالة عضو
router.delete('/:groupId/members/:memberId', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        if (group.admin.toString() !== req.userId) {
            return res.status(403).json({ message: 'ليس لديك صلاحيات' });
        }

        group.members = group.members.filter(m => m.toString() !== req.params.memberId);
        await group.save();
        await group.populate('members', 'name avatar');

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// الحصول على رسائل الجروب
router.get('/:groupId/messages', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        res.json({ messages: group.messages });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إرسال رسالة في الجروب
router.post('/:groupId/messages', authMiddleware, async (req, res) => {
    try {
        const { text, attachments } = req.body;
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'الجروب غير موجود' });
        }

        const message = {
            sender: req.userId,
            text,
            attachments: attachments || [],
            createdAt: new Date(),
        };

        group.messages.push(message);
        await group.save();

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

export default router;
