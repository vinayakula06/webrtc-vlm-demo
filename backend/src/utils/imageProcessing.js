/**
 * Image Processing Utilities
 */

const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');

/**
 * Convert base64 string to buffer
 */
function base64ToBuffer(base64String) {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Convert buffer to image tensor
 */
async function bufferToImageTensor(imageBuffer, targetSize = [300, 300]) {
  try {
    // Use sharp to decode and resize image
    const processedImageBuffer = await sharp(imageBuffer)
      .resize(targetSize[0], targetSize[1])
      .rgb()
      .raw()
      .toBuffer();

    // Convert to tensor
    const tensor = tf.tensor3d(
      new Uint8Array(processedImageBuffer),
      [targetSize[1], targetSize[0], 3],
      'int32'
    );

    // Normalize to [0, 1] and add batch dimension
    const normalizedTensor = tensor.cast('float32').div(255.0).expandDims(0);
    
    // Clean up intermediate tensor
    tensor.dispose();

    return normalizedTensor;

  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Resize image while maintaining aspect ratio
 */
async function resizeImageWithAspectRatio(imageBuffer, maxWidth = 640, maxHeight = 640) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = width / height;
    let newWidth, newHeight;

    if (aspectRatio > 1) {
      // Landscape
      newWidth = Math.min(maxWidth, width);
      newHeight = Math.round(newWidth / aspectRatio);
    } else {
      // Portrait or square
      newHeight = Math.min(maxHeight, height);
      newWidth = Math.round(newHeight * aspectRatio);
    }

    const resizedBuffer = await sharp(imageBuffer)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      buffer: resizedBuffer,
      width: newWidth,
      height: newHeight,
      originalWidth: width,
      originalHeight: height
    };

  } catch (error) {
    console.error('Image resize error:', error);
    throw new Error('Failed to resize image');
  }
}

/**
 * Compress image
 */
async function compressImage(imageBuffer, quality = 80) {
  try {
    const compressedBuffer = await sharp(imageBuffer)
      .jpeg({ quality })
      .toBuffer();

    return compressedBuffer;

  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Convert tensor to image buffer
 */
async function tensorToImageBuffer(tensor, format = 'jpeg') {
  try {
    // Remove batch dimension if present
    let imageTensor = tensor;
    if (tensor.shape.length === 4) {
      imageTensor = tensor.squeeze([0]);
    }

    // Convert to uint8
    const uint8Tensor = imageTensor.mul(255).cast('uint8');
    
    // Get raw data
    const rawData = await uint8Tensor.data();
    const [height, width, channels] = uint8Tensor.shape;

    // Use sharp to convert raw data to image buffer
    let sharpInstance = sharp(Buffer.from(rawData), {
      raw: {
        width,
        height,
        channels
      }
    });

    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg();
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png();
    }

    const imageBuffer = await sharpInstance.toBuffer();

    // Clean up tensors
    uint8Tensor.dispose();
    if (imageTensor !== tensor) {
      imageTensor.dispose();
    }

    return imageBuffer;

  } catch (error) {
    console.error('Tensor to image conversion error:', error);
    throw new Error('Failed to convert tensor to image');
  }
}

module.exports = {
  base64ToBuffer,
  bufferToImageTensor,
  resizeImageWithAspectRatio,
  compressImage,
  tensorToImageBuffer
};
