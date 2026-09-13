import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    text: String,
    attachments: [String],
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read'],
        default: 'sent',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    messages: [messageSchema],
    lastMessage: String,
    lastMessageTime: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
