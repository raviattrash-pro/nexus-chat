import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import './VideoCallOverlay.css';

interface VideoCallOverlayProps {
  currentUserId: string;
  targetUserId: string | null;
  targetUserName: string;
  isActive: boolean;
  isIncoming: boolean;
  callType: 'audio' | 'video';
  onEndCall: () => void;
}

export default function VideoCallOverlay({ currentUserId, targetUserId, targetUserName, isActive, isIncoming, callType, onEndCall }: VideoCallOverlayProps) {
  const { sendMessage } = useWebSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [callStatus, setCallStatus] = useState<string>('Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');

  useEffect(() => {
    if (!isActive) return;
    
    // Reset state based on incoming call type
    setIsVideoOff(callType === 'audio');

    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Get media
    navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        if (!isIncoming) {
          // I am the caller
          setCallStatus('Ringing...');
          peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
              sendMessage('/app/call.offer', {
                type: 'offer',
                senderId: currentUserId,
                receiverId: targetUserId,
                sdp: peerConnection.localDescription
              });
            });
        }
      })
      .catch(err => {
        console.error("Failed to get local stream", err);
        setCallStatus("Failed to access camera/mic. " + err.message);
      });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setCallStatus('Connected');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage('/app/call.ice', {
          type: 'ice',
          senderId: currentUserId,
          receiverId: targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Listen for signaling from Context via CustomEvent
    const handleSignal = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      // Only process signals from our target user
      if (data.senderId !== targetUserId) return;

      if (data.type === 'offer' && isIncoming) {
        setCallStatus('Connecting...');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendMessage('/app/call.answer', {
          type: 'answer',
          senderId: currentUserId,
          receiverId: targetUserId,
          sdp: peerConnection.localDescription
        });
      } else if (data.type === 'answer') {
        setCallStatus('Connected');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.type === 'ice') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else if (data.type === 'end') {
        cleanup();
        onEndCall();
      }
    };

    window.addEventListener('webrtc-signal', handleSignal);

    return () => {
      window.removeEventListener('webrtc-signal', handleSignal);
      cleanup();
    };
  }, [isActive, isIncoming, currentUserId, targetUserId, callType]);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const handleHangup = () => {
    sendMessage('/app/call.ice', { type: 'end', senderId: currentUserId, receiverId: targetUserId });
    cleanup();
    onEndCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="call-overlay"
      >
        <div className="call-header">
          <h2>{targetUserName}</h2>
          <p>{callStatus}</p>
        </div>

        {/* Main Display: Video or Audio Avatar */}
        {callType === 'video' ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="remote-video"
          />
        ) : (
          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${targetUserName.replace(' ', '')}&backgroundColor=b6e3f4`} alt="Avatar" className="audio-only-avatar" />
        )}

        {/* Local Video Mini-Player (only shown if it's a video call) */}
        {callType === 'video' && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="local-video-container"
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`local-video ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="video-off-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
                </svg>
              </div>
            )}
          </motion.div>
        )}

        {/* Controls */}
        <div className="call-controls">
          <button 
            onClick={toggleMute}
            className={`btn-control ${isMuted ? 'active' : ''}`}
          >
            {isMuted ? (
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          <button 
            onClick={handleHangup}
            className="btn-hangup"
          >
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 11l.07.07a1 1 0 010 1.41l-.9.9a1 1 0 01-1.42 0L1.76 12.4a1 1 0 010-1.42l.9-.9a1 1 0 011.41 0l.07.07zm14 0l.07.07a1 1 0 010 1.41l-.9.9a1 1 0 01-1.42 0L17.76 12.4a1 1 0 010-1.42l.9-.9a1 1 0 011.41 0l.07.07z" />
            </svg>
          </button>

          {callType === 'video' && (
            <button 
              onClick={toggleVideo}
              className={`btn-control ${isVideoOff ? 'active' : ''}`}
            >
              {isVideoOff ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
