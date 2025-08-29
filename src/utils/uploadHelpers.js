import { message, notification } from 'antd';
import { generateUniqueFileName, createFileObject, cleanupTempUrls } from './fileHelpers';

/**
 * Simulateur d'upload vers serveur (remplace le vrai backend)
 */
export class MockUploadService {
  constructor() {
    this.uploads = new Map(); 
    this.baseUrl = '/api/uploads'; 
  }

  /**
   * Simuler l'upload d'un fichier
   */
  async uploadFile(file, options = {}) {
    const {
      onProgress,
      category = 'general',
      metadata = {},
      generateThumb = true
    } = options;

    const uploadTime = Math.random() * 2000 + 1000; 
    
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress > 95) progress = 95;
        
        onProgress?.(Math.round(progress));
      }, uploadTime / 10);

      setTimeout(() => {
        clearInterval(interval);
        onProgress?.(100);

        try {
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
          const fileName = generateUniqueFileName(file.name, `${category}_`);
          const fileUrl = `${this.baseUrl}/${category}/${fileName}`;

          const tempUrl = URL.createObjectURL(file);

          const uploadResult = {
            id: uniqueId,
            fileName,
            originalName: file.name,
            url: fileUrl,
            tempUrl, 
            size: file.size,
            type: file.type,
            category,
            metadata: {
              ...metadata,
              uploadedAt: new Date().toISOString(),
              uploadId: uniqueId
            }
          };

          this.uploads.set(uniqueId, {
            ...uploadResult,
            file: file
          });

          resolve(uploadResult);
        } catch (error) {
          reject(new Error(`Erreur upload: ${error.message}`));
        }
      }, uploadTime);
    });
  }


  async uploadMultiple(files, options = {}) {
    const {
      onProgress,
      maxConcurrent = 3,
      stopOnError = false
    } = options;

    const results = [];
    const errors = [];
    let completed = 0;

    const processBatch = async (batch) => {
      const promises = batch.map(async (fileData, index) => {
        try {
          const result = await this.uploadFile(fileData.file, {
            ...fileData.options,
            onProgress: (progress) => {
              const overallProgress = ((completed + (progress / 100)) / files.length) * 100;
              onProgress?.(Math.round(overallProgress));
            }
          });
          
          completed++;
          return { success: true, result, file: fileData.file };
        } catch (error) {
          completed++;
          const errorResult = { success: false, error, file: fileData.file };
          
          if (stopOnError) {
            throw errorResult;
          }
          
          return errorResult;
        }
      });

      return Promise.all(promises);
    };

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      try {
        const batchResults = await processBatch(batch);
        
        batchResults.forEach(result => {
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push(result);
          }
        });
        
      } catch (error) {
        if (stopOnError) {
          throw error;
        }
      }
    }

    return { results, errors };
  }


  async deleteFile(fileId) {
    const file = this.uploads.get(fileId);
    if (!file) {
      throw new Error('Fichier non trouvé');
    }

    if (file.tempUrl) {
      URL.revokeObjectURL(file.tempUrl);
    }

    this.uploads.delete(fileId);
    return true;
  }


  getFile(fileId) {
    return this.uploads.get(fileId);
  }

  getFilesByCategory(category) {
    return Array.from(this.uploads.values()).filter(
      file => file.category === category
    );
  }


  cleanup() {
    this.uploads.forEach(file => {
      if (file.tempUrl) {
        URL.revokeObjectURL(file.tempUrl);
      }
    });
    this.uploads.clear();
  }
}

export const mockUploadService = new MockUploadService();


export class UploadManager {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      validateBeforeUpload: true,
      autoCleanup: true,
      ...options
    };
    
    this.activeUploads = new Map();
  }

  /**
   * Uploader avec retry automatique
   */
  async uploadWithRetry(file, uploadOptions = {}) {
    const { maxRetries, retryDelay } = this.options;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await mockUploadService.uploadFile(file, uploadOptions);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`Upload échoué (tentative ${attempt}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Gérer l'upload d'une liste de fichiers avec UI
   */
  async handleFilesUpload(files, options = {}) {
    const {
      category = 'general',
      showProgress = true,
      showNotifications = true,
      metadata = {},
      onSuccess,
      onError,
      onProgress
    } = options;

    let hideProgress;
    
    if (showProgress) {
      hideProgress = message.loading('Upload en cours...', 0);
    }

    try {
      const fileObjects = await Promise.all(
        files.map(async file => {
          const fileObj = await createFileObject(file, category, metadata);
          return {
            file: fileObj.file,
            options: {
              category,
              metadata: {
                ...metadata,
                originalIndex: files.indexOf(file)
              },
              onProgress: (progress) => {
                onProgress?.({
                  file: fileObj,
                  progress,
                  status: 'uploading'
                });
              }
            }
          };
        })
      );

      const { results, errors } = await mockUploadService.uploadMultiple(fileObjects, {
        onProgress: (overallProgress) => {
          onProgress?.({
            overallProgress,
            status: 'processing'
          });
        }
      });

      if (hideProgress) hideProgress();

      // Notifications de résultat
      if (showNotifications) {
        if (results.length > 0) {
          notification.success({
            message: 'Upload réussi',
            description: `${results.length} fichier(s) uploadé(s) avec succès`,
            duration: 3
          });
        }

        if (errors.length > 0) {
          notification.error({
            message: 'Erreurs d\'upload',
            description: `${errors.length} fichier(s) ont échoué`,
            duration: 5
          });
        }
      }

      // Callbacks
      if (results.length > 0) {
        onSuccess?.(results);
      }

      if (errors.length > 0) {
        onError?.(errors);
      }

      return { results, errors };

    } catch (error) {
      if (hideProgress) hideProgress();

      if (showNotifications) {
        notification.error({
          message: 'Erreur d\'upload',
          description: error.message || 'Une erreur inattendue s\'est produite',
          duration: 5
        });
      }

      onError?.([{ error, file: null }]);
      throw error;
    }
  }

  /**
   * Annuler tous les uploads en cours
   */
  cancelAllUploads() {
    this.activeUploads.forEach((upload, id) => {
      upload.cancel?.();
      this.activeUploads.delete(id);
    });
  }

  /**
   * Nettoyer les ressources
   */
  cleanup() {
    this.cancelAllUploads();
    if (this.options.autoCleanup) {
      mockUploadService.cleanup();
    }
  }
}

/**
 * Helper pour validation avant upload
 */
export const validateFilesBeforeUpload = (files, constraints = {}) => {
  const {
    maxFiles = 10,
    maxTotalSize = 100 * 1024 * 1024, // 100MB
    allowedTypes = ['image/*', 'application/pdf'],
    maxFileSize = 10 * 1024 * 1024 // 10MB
  } = constraints;

  const errors = [];
  const warnings = [];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} fichiers autorisés (${files.length} sélectionnés)`);
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    errors.push(`Taille totale trop importante: ${(totalSize / 1024 / 1024).toFixed(1)}MB / ${(maxTotalSize / 1024 / 1024).toFixed(1)}MB`);
  }

  files.forEach((file, index) => {
    const fileErrors = [];

    if (file.size > maxFileSize) {
      fileErrors.push(`trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    }

    const isTypeAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isTypeAllowed) {
      fileErrors.push(`type non autorisé (${file.type})`);
    }

    if (fileErrors.length > 0) {
      errors.push(`${file.name}: ${fileErrors.join(', ')}`);
    }

    if (file.size > maxFileSize * 0.7) {
      warnings.push(`${file.name} est volumineux et prendra du temps à uploader`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalFiles: files.length,
      totalSize,
      averageSize: totalSize / files.length
    }
  };
};

/**
 * Convertir FileList vers Array avec métadonnées
 */
export const processFileList = async (fileList, options = {}) => {
  const {
    generatePreviews = true,
    extractMetadata = true,
    assignCategories = false
  } = options;

  const files = Array.from(fileList);
  
  return Promise.all(files.map(async (file, index) => {
    const processedFile = await createFileObject(file);
    
    if (assignCategories) {
      if (index === 0) {
        processedFile.category = 'before';
      } else if (index === 1) {
        processedFile.category = 'after';
      }
    }

    return processedFile;
  }));
};

/**
 * Sauvegarder métadonnées d'upload dans localStorage
 */
export const saveUploadSession = (sessionId, data) => {
  try {
    const sessions = JSON.parse(localStorage.getItem('uploadSessions') || '{}');
    sessions[sessionId] = {
      ...data,
      timestamp: Date.now()
    };
    localStorage.setItem('uploadSessions', JSON.stringify(sessions));
  } catch (error) {
    console.warn('Impossible de sauvegarder la session d\'upload:', error);
  }
};

/**
 * Récupérer métadonnées d'upload
 */
export const getUploadSession = (sessionId) => {
  try {
    const sessions = JSON.parse(localStorage.getItem('uploadSessions') || '{}');
    return sessions[sessionId] || null;
  } catch (error) {
    console.warn('Impossible de récupérer la session d\'upload:', error);
    return null;
  }
};

/**
 * Nettoyer les anciennes sessions d'upload
 */
export const cleanupOldSessions = (maxAgeHours = 24) => {
  try {
    const sessions = JSON.parse(localStorage.getItem('uploadSessions') || '{}');
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();

    const cleaned = Object.fromEntries(
      Object.entries(sessions).filter(([_, session]) => {
        return (now - session.timestamp) < maxAge;
      })
    );

    localStorage.setItem('uploadSessions', JSON.stringify(cleaned));
  } catch (error) {
    console.warn('Impossible de nettoyer les sessions d\'upload:', error);
  }
};

/**
 * Instance par défaut du gestionnaire d'upload
 */
export const defaultUploadManager = new UploadManager({
  maxRetries: 3,
  retryDelay: 1000,
  validateBeforeUpload: true,
  autoCleanup: true
});

export default {
  MockUploadService,
  UploadManager,
  mockUploadService,
  defaultUploadManager,
  validateFilesBeforeUpload,
  processFileList,
  saveUploadSession,
  getUploadSession,
  cleanupOldSessions
};