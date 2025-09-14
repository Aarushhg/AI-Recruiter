// frontend/src/utils/proctorUtils.js

import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs'; // Required for TensorFlow.js

let faceModel = null;
let objectModel = null;

/**
 * Load models if not already loaded
 */
export const loadModels = async () => {
  if (!faceModel) faceModel = await blazeface.load();
  if (!objectModel) objectModel = await cocoSsd.load();
};

/**
 * Detect multiple faces in camera frame
 * @param {HTMLVideoElement} video 
 * @returns {boolean}
 */
export const detectMultipleFaces = async (video) => {
  if (!faceModel) await loadModels();
  const predictions = await faceModel.estimateFaces(video, false);
  return predictions.length > 1;
};

/**
 * Detect presence of a phone in the camera frame
 * @param {HTMLVideoElement} video 
 * @returns {boolean}
 */
export const detectPhoneInFrame = async (video) => {
  if (!objectModel) await loadModels();
  const predictions = await objectModel.detect(video);
  return predictions.some(p => p.class === 'cell phone' || p.class === 'remote');
};
