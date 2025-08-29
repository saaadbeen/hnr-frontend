import { message } from 'antd';

export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
  PDF: ['application/pdf'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const SIZE_LIMITS = {
  IMAGE: 10,
  PDF: 20,
  DOCUMENT: 25
};

/**
 * Valider un fichier selon les critères
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = SIZE_LIMITS.IMAGE,
    allowedTypes = FILE_TYPES.IMAGES,
    maxCount = 5,
    currentCount = 0
  } = options;

  if (currentCount >= maxCount) {
    return {
      valid: false,
      error: `Maximum ${maxCount} fichiers autorisés`
    };
  }

  const isValidType = allowedTypes.includes(file.type);
  if (!isValidType) {
    const typeNames = allowedTypes.map(type => {
      if (type.includes('image')) return 'Images';
      if (type.includes('pdf')) return 'PDF';
      return type;
    }).join(', ');
    
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés: ${typeNames}`
    };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${fileSizeMB.toFixed(1)}MB). Taille max: ${maxSize}MB`
    };
  }

  return { valid: true };
};

/**
 * Compresser une image
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Erreur lors de la compression'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Générer une preview/thumbnail
 */
export const generatePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmNGQ0ZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UERGPC90ZXh0Pjwvc3ZnPg==');
    } else {
      resolve(null);
    }
  });
};

/**
 * Obtenir les métadonnées EXIF d'une image
 */
export const extractImageMetadata = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({});
      return;
    }

    const img = new Image();
    img.onload = () => {
      const metadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2),
        resolution: `${img.naturalWidth}x${img.naturalHeight}`,
        format: file.type.split('/')[1].toUpperCase()
      };
      resolve(metadata);
    };
    img.onerror = () => resolve({});
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Formater la taille d'un fichier
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Générer un nom de fichier unique
 */
export const generateUniqueFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  
  return `${prefix}${baseName}_${timestamp}_${random}.${extension}`;
};

/**
 * Créer un objet fichier structuré pour l'API
 */
export const createFileObject = async (file, category = null, metadata = {}) => {
  const preview = await generatePreview(file);
  const imageMetadata = await extractImageMetadata(file);
  
  return {
    uid: `file_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    category,
    preview,
    metadata: {
      ...imageMetadata,
      ...metadata,
      originalName: file.name,
      uploadTime: new Date().toISOString()
    },
    file: file, 
    status: 'done',
    url: null
  };
};

/**
 * Validation spécialisée pour photos avant/après
 */
export const validateBeforeAfterPhotos = (photos) => {
  const errors = [];
  
  if (!photos || photos.length === 0) {
    errors.push('Photos avant/après obligatoires pour documenter l\'intervention');
    return { valid: false, errors };
  }

  const beforePhotos = photos.filter(p => p.category === 'before');
  const afterPhotos = photos.filter(p => p.category === 'after');

  if (beforePhotos.length === 0) {
    errors.push('Photo AVANT intervention manquante');
  }

  if (afterPhotos.length === 0) {
    errors.push('Photo APRÈS intervention manquante');
  }

  // Vérifier que les photos sont bien des images
  photos.forEach(photo => {
    if (!photo.type || !photo.type.startsWith('image/')) {
      errors.push(`${photo.name} n'est pas une image valide`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      total: photos.length,
      before: beforePhotos.length,
      after: afterPhotos.length
    }
  };
};

/**
 * Utilitaire pour nettoyer les URLs temporaires
 */
export const cleanupTempUrls = (files) => {
  files.forEach(file => {
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    if (file.preview && file.preview.startsWith('blob:')) {
      URL.revokeObjectURL(file.preview);
    }
  });
};

export default {
  FILE_TYPES,
  SIZE_LIMITS,
  validateFile,
  compressImage,
  generatePreview,
  extractImageMetadata,
  formatFileSize,
  generateUniqueFileName,
  createFileObject,
  validateBeforeAfterPhotos,
  cleanupTempUrls
};