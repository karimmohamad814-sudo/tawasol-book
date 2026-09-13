import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';

// تحميل المتغيرات البيئية
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware الأمان
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));

// Middleware لمعالجة البيانات
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// الاتصال بقاعدة البيانات
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tawasol-book');
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
        process.exit(1);
    }
};

// استدعاء الاتصال
connectDB();

// Store لتخزين المستخدمين المتصلين
const connectedUsers = new Map();

// معالجات Socket.io
io.on('connection', (socket) => {
    console.log('👤 مستخدم جديد متصل:', socket.id);

    // حفظ المستخدم في قائمة المتصلين
    socket.on('user:login', (userId) => {
        connectedUsers.set(userId, socket.id);
        io.emit('user:status', { userId, status: 'online' });
    });

    // الرسائل الخاصة
    socket.on('message:send', (data) => {
        const { recipientId } = data;
        const recipientSocket = connectedUsers.get(recipientId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('message:new', data);
        }
    });

    // الكتابة
    socket.on('user:typing', (data) => {
        const { recipientId } = data;
        const recipientSocket = connectedUsers.get(recipientId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('user:typing', { userId: socket.id, typing: true });
        }
    });

    // المكالمات
    socket.on('call:initiate', (data) => {
        const { recipientId, type } = data;
        const recipientSocket = connectedUsers.get(recipientId);
        if (recipientSocket) {
            io.to(recipientSocket).emit('call:incoming', { callerId: socket.id, type });
        }
    });

    socket.on('call:accept', (data) => {
        const { callerId } = data;
        const callerSocket = connectedUsers.get(callerId);
        if (callerSocket) {
            io.to(callerSocket).emit('call:accepted', { answered: true });
        }
    });

    socket.on('call:reject', (data) => {
        const { callerId } = data;
        const callerSocket = connectedUsers.get(callerId);
        if (callerSocket) {
            io.to(callerSocket).emit('call:rejected', { rejected: true });
        }
    });

    // الجروبات
    socket.on('group:join', (groupId) => {
        socket.join(`group:${groupId}`);
    });

    socket.on('group:message', (data) => {
        io.to(`group:${data.groupId}`).emit('group:message', data);
    });

    // الانقطاع
    socket.on('disconnect', () => {
        console.log('👤 مستخدم قطع الاتصال:', socket.id);
        connectedUsers.forEach((value, key) => {
            if (value === socket.id) {
                connectedUsers.delete(key);
                io.emit('user:status', { userId: key, status: 'offline' });
            }
        });
    });
});

// مسارات API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'تطبيق تواصل بوك يعمل بشكل صحيح' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/calls', require('./routes/calls'));

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error('خطأ:', err);
    res.status(err.status || 500).json({
        error: err.message || 'حدث خطأ في الخادم',
    });
});

// بدء الخادم
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
});

export { app, server, io };
