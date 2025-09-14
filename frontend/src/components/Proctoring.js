import React, { useEffect, useRef, useState } from 'react';
import {
  detectMultipleFaces,
  detectPhoneInFrame,
  loadModels
} from '../utils/proctorUtils';

// Import TensorFlow.js for handling tensors and image resizing
import * as tf from '@tensorflow/tfjs';

const Proctoring = ({ onViolation, onTestFinish }) => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false); // Track if the camera is streaming

  // Handle tab or window switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolation("Tab switch or window minimized detected");
      }
    };

    const handleBlur = () => {
      onViolation("User switched tabs or applications");
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onViolation]);

  // Handle camera monitoring
  useEffect(() => {
    const startMonitoring = async () => {
      try {
        await loadModels(); // Load models for detection

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (videoRef.current) {
          // Set the video stream to the video element
          videoRef.current.srcObject = stream;

          // Wait for metadata to load before attempting to play the video
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              videoRef.current.play()
                .then(() => {
                  console.log('Video playback started');
                  setIsStreaming(true); // Mark that streaming is active
                })
                .catch((error) => {
                  console.error('Error starting video playback:', error);
                  onViolation("Error starting video playback.");
                });
            } else {
              console.error("Invalid video dimensions", videoRef.current.videoWidth, videoRef.current.videoHeight);
            }
          };
        }

        const detectLoop = async () => {
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            const tensor = await tf.browser.fromPixels(videoRef.current); // Create tensor from video frame
            const resizedTensor = tf.image.resizeBilinear(tensor, [224, 224]); // Resize to model's expected size

            // Convert tensor dtype to int32 (model expects int32)
            const int32Tensor = resizedTensor.toInt(); // Ensure the tensor is of type int32

            // Detect multiple faces and phones in the frame
            const multipleFaces = await detectMultipleFaces(int32Tensor);
            if (multipleFaces) {
              onViolation("Multiple faces detected");
              return;
            }

            const phoneDetected = await detectPhoneInFrame(int32Tensor);
            if (phoneDetected) {
              onViolation("Mobile phone detected in frame");
              return;
            }
          } else {
            console.error("Invalid video dimensions for processing", videoRef.current.videoWidth, videoRef.current.videoHeight);
          }

          // Continue the detection loop if streaming is active
          if (isStreaming) {
            requestAnimationFrame(detectLoop);
          }
        };

        detectLoop(); // Start detection loop
      } catch (error) {
        console.error("Error accessing camera:", error);
        onViolation("Error accessing camera.");
      }
    };

    startMonitoring(); // Start monitoring the video stream

    // Cleanup the video stream when component unmounts or test is finished
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        onTestFinish(); // Trigger the test finish callback
      }
    };
  }, [onViolation, isStreaming, onTestFinish]);

  return (
    <div>
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};

export default Proctoring;

