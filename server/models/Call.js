import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['voice', 'video'],
        required: true,
    },
    status: {
        type: String,
        enum: ['ringing', 'accepted', 'rejected', 'ended', 'missed'],
        default: 'ringing',
    },
    duration: {
        type: Number,
        default: 0,
    },
    startTime: Date,
    endTime: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Call = mongoose.model('Call', callSchema);
export default Call;
