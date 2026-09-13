// إدارة المكالمات الصوتية والفيديو
class CallManager {
    constructor() {
        this.currentCall = null;
        this.socket = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.callType = null;
        this.callDuration = 0;
        this.callTimer = null;
    }

    async initialize(socket) {
        this.socket = socket;
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('call:incoming', (data) => {
            this.handleIncomingCall(data);
        });

        this.socket.on('call:accepted', (data) => {
            this.handleCallAccepted(data);
        });

        this.socket.on('call:rejected', (data) => {
            this.handleCallRejected(data);
        });

        this.socket.on('call:ended', (data) => {
            this.handleCallEnded(data);
        });

        this.socket.on('webrtc:offer', (data) => {
            this.handleWebRTCOffer(data);
        });

        this.socket.on('webrtc:answer', (data) => {
            this.handleWebRTCAnswer(data);
        });

        this.socket.on('webrtc:ice-candidate', (data) => {
            this.handleICECandidate(data);
        });
    }

    async initiateCall(recipientId, type = config.CALL_TYPES.VOICE) {
        try {
            this.callType = type;

            // الحصول على الجهاز (صوت و/أو فيديو)
            const constraints = {
                audio: true,
                video: type === config.CALL_TYPES.VIDEO,
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // إنشاء اتصال WebRTC
            await this.createPeerConnection();

            // إرسال عرض المكالمة
            if (this.socket) {
                this.socket.emit('call:initiate', {
                    recipientId,
                    type,
                });
            }

            return this.currentCall;
        } catch (error) {
            console.error('فشل بدء المكالمة:', error);
            throw error;
        }
    }

    async createPeerConnection() {
        const configuration = {
            iceServers: config.ICE_SERVERS,
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // إضافة المسارات المحلية
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }

        // معالجة المسارات البعيدة
        this.peerConnection.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            this.remoteStream.addTrack(event.track);
            this.onRemoteStreamReady?.(this.remoteStream);
        };

        // معالجة مرشحات ICE
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.socket) {
                this.socket.emit('webrtc:ice-candidate', {
                    candidate: event.candidate,
                    callId: this.currentCall?._id,
                });
            }
        };

        // معالجة تغيير حالة الاتصال
        this.peerConnection.onconnectionstatechange = () => {
            if (this.peerConnection.connectionState === 'failed' || 
                this.peerConnection.connectionState === 'disconnected') {
                this.endCall();
            }
        };
    }

    async acceptCall(callId) {
        try {
            // الحصول على الجهاز
            const constraints = {
                audio: true,
                video: this.callType === config.CALL_TYPES.VIDEO,
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // إنشاء اتصال WebRTC
            await this.createPeerConnection();

            // إرسال قبول المكالمة
            if (this.socket) {
                this.socket.emit('call:accept', { callId });
            }

            return true;
        } catch (error) {
            console.error('فشل قبول المكالمة:', error);
            throw error;
        }
    }

    rejectCall(callId) {
        if (this.socket) {
            this.socket.emit('call:reject', { callId });
        }
    }

    async endCall() {
        try {
            if (this.callTimer) {
                clearInterval(this.callTimer);
            }

            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
            }

            if (this.peerConnection) {
                this.peerConnection.close();
            }

            if (this.socket && this.currentCall) {
                this.socket.emit('call:end', { callId: this.currentCall._id });
            }

            this.currentCall = null;
            this.localStream = null;
            this.remoteStream = null;
            this.peerConnection = null;
        } catch (error) {
            console.error('خطأ في إنهاء المكالمة:', error);
        }
    }

    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    async switchCamera() {
        try {
            if (!this.localStream) return;

            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                await videoTrack.applyConstraints({
                    facingMode: { exact: 'user' },
                });
            }
        } catch (error) {
            console.error('فشل تبديل الكاميرا:', error);
        }
    }

    startCallTimer() {
        this.callDuration = 0;
        this.callTimer = setInterval(() => {
            this.callDuration++;
            this.onDurationChange?.(this.callDuration);
        }, 1000);
    }

    handleIncomingCall(data) {
        this.currentCall = data.call;
        this.callType = data.call.type;
        this.onIncomingCall?.(data.call);
    }

    handleCallAccepted(data) {
        this.onCallAccepted?.(data.call);
        this.startCallTimer();
    }

    handleCallRejected(data) {
        this.endCall();
        this.onCallRejected?.(data.call);
    }

    handleCallEnded(data) {
        this.endCall();
        this.onCallEnded?.(data.call);
    }

    handleWebRTCOffer(data) {
        // معالجة عرض WebRTC
        if (this.peerConnection) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            this.peerConnection.createAnswer()
                .then(answer => this.peerConnection.setLocalDescription(answer))
                .then(() => {
                    if (this.socket) {
                        this.socket.emit('webrtc:answer', {
                            answer: this.peerConnection.localDescription,
                            callId: this.currentCall?._id,
                        });
                    }
                });
        }
    }

    handleWebRTCAnswer(data) {
        if (this.peerConnection) {
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    }

    handleICECandidate(data) {
        if (this.peerConnection && data.candidate) {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }
}

const calls = new CallManager();
