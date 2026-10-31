import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCaptureForStatus, onCaptureForChat }) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start webcam stream when modal opens
  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      if (!isOpen || capturedImage) return;
      try {
        setCameraError(false);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera access not available or denied:', err);
        setCameraError(true);
      }
    }

    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, capturedImage, facingMode]);

  // Clean up stream on close
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCapturedImage(null);
    onClose();
  };

  // Capture photo from live video stream
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(imgDataUrl);

    // Stop live stream to save resources
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Handle local file fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[92vh]">
        {/* Top bar */}
        <div className="p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-stone-900/90 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">Bloom Camera</span>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Captured Photo Area */}
        <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Captured photo preview */
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover max-h-[480px]"
            />
          ) : !cameraError ? (
            /* Live Camera Stream */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-[480px]"
            />
          ) : (
            /* Camera Unavailable / Fallback Screen */
            <div className="p-6 text-center text-stone-300 flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-violet-900/40 border border-violet-700/50 flex items-center justify-center text-violet-400 mb-3 shadow-lg">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Camera Not Connected</h3>
              <p className="text-xs text-stone-400 max-w-xs mb-5">
                Grant camera permission or pick an image directly from your device to post to Status or Chat.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo from Device</span>
              </button>
            </div>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Bottom Action Controls */}
        <div className="p-4 bg-stone-900 flex flex-col items-center justify-center">
          {capturedImage ? (
            /* Action Buttons after photo capture */
            <div className="w-full space-y-2.5">
              <div className="flex items-center gap-2.5">
                {/* Post to Status Button */}
                <button
                  onClick={() => {
                    if (onCaptureForStatus) onCaptureForStatus(capturedImage);
                    handleClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Post to Status</span>
                </button>

                {/* Send in Chat Button */}
                <button
                  onClick={() => {
                    if (onCaptureForChat) onCaptureForChat(capturedImage);
                    handleClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors border border-stone-700"
                >
                  <Send className="w-4 h-4 text-violet-400" />
                  <span>Send in Chat</span>
                </button>
              </div>

              {/* Retake Photo Button */}
              <button
                onClick={() => setCapturedImage(null)}
                className="w-full py-2 rounded-xl text-stone-400 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>
            </div>
          ) : (
            /* Camera Shutter and Tools */
            <div className="w-full flex items-center justify-between px-4">
              {/* Upload fallback button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                title="Upload photo"
              >
                <Upload className="w-5 h-5" />
              </button>

              {/* Big Circular Shutter Button */}
              <button
                onClick={handleSnap}
                className="w-18 h-18 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-95 transition-transform shadow-2xl flex items-center justify-center"
                title="Take photo"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-violet-100 transition-colors shadow-inner" />
              </button>

              {/* Flip camera button */}
              <button
                onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                className="p-3 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
                title="Switch camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

