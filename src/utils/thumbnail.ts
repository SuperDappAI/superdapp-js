import sharp from 'sharp';

// Helper functions
function isImage(type: string): boolean {
  return type.startsWith('image/');
}

function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

function Thumbnail() {
  let dHeight = 150;
  let dWidth = 150;
  let quality = 0.7;

  /**
   * Validate if the provided buffer is an image
   */
  const validateImage = async (
    imageBuffer: Buffer,
    type: string
  ): Promise<boolean> => {
    if (!isImage(type)) {
      return false;
    }

    // Basic validation - check if buffer has minimum size for an image
    if (imageBuffer.length < 100) {
      return false;
    }

    // Check for common image file signatures
    const signatures = {
      'image/jpeg': [0xff, 0xd8, 0xff],
      'image/png': [0x89, 0x50, 0x4e, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };

    const signature = signatures[type as keyof typeof signatures];
    if (signature) {
      return signature.every((byte, index) => imageBuffer[index] === byte);
    }

    return true;
  };

  /**
   * Create thumbnail with actual resizing using Sharp
   */
  const create = async (imageBuffer: Buffer, type: string, ratio: boolean) => {
    const isValid = await validateImage(imageBuffer, type);
    if (!isValid) {
      throw new Error('Invalid image or unsupported format');
    }

    try {
      // Get original image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      // Calculate new dimensions
      let newWidth = dWidth;
      let newHeight = dHeight;

      if (ratio && originalWidth && originalHeight) {
        // Maintain aspect ratio
        const aspectRatio = originalWidth / originalHeight;

        if (originalWidth > originalHeight) {
          // Landscape image
          newWidth = dWidth;
          newHeight = Math.round(dWidth / aspectRatio);
        } else {
          // Portrait or square image
          newHeight = dHeight;
          newWidth = Math.round(dHeight * aspectRatio);
        }
      }

      // Resize the image using Sharp
      const resizedBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          fit: ratio ? 'inside' : 'fill', // 'inside' maintains aspect ratio, 'fill' forces exact dimensions
          withoutEnlargement: true, // Don't enlarge if image is smaller than target
        })
        .jpeg({ quality: Math.round(quality * 100) }) // Convert to JPEG with specified quality
        .toBuffer();

      const dataUrl = bufferToDataUrl(resizedBuffer, 'image/jpeg');

      return {
        data: dataUrl,
        buffer: resizedBuffer, // This is now the ACTUALLY resized image
        dimensions: {
          originalWidth,
          originalHeight,
          width: newWidth,
          height: newHeight,
          quality: quality,
          maintainRatio: ratio,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to resize image: ${errorMessage}`);
    }
  };

  const createFromFile = async (
    fileBuffer: Buffer,
    mimeType: string,
    ratio: boolean
  ) => {
    if (!isImage(mimeType)) {
      return { data: null, buffer: null };
    }

    try {
      return await create(fileBuffer, mimeType, ratio);
    } catch (error) {
      console.error('Error processing image:', error);
      return { data: null, buffer: null };
    }
  };

  const createFromStream = async (
    stream: NodeJS.ReadableStream,
    mimeType: string,
    ratio: boolean
  ) => {
    if (!isImage(mimeType)) {
      return { data: null, buffer: null };
    }

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      return await create(buffer, mimeType, ratio);
    } catch (error) {
      console.error('Error processing image from stream:', error);
      return { data: null, buffer: null };
    }
  };

  const setDimensions = (height: number, width: number) => {
    dHeight = height;
    dWidth = width;
  };

  const setQuality = (q: number) => {
    quality = q;
  };

  return {
    create,
    createFromFile,
    createFromStream,
    validateImage,
    setDimensions,
    setQuality,
  };
}

export default Thumbnail;
