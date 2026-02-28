import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ImageProcessor } from '../services/imageProcessor';

interface UploadConfig {
    destination: string;
    filePrefix?: string;
    maxFileSize?: number;
    maxWidth?: number;
    quality?: number;
    convertToWebP?: boolean;
    allowedTypes?: string[];
}

const DEFAULT_CONFIG: UploadConfig = {
    destination: 'uploads',
    filePrefix: 'file',
    maxFileSize: 500 * 1024, // 500KB
    maxWidth: 1200,
    quality: 75,
    convertToWebP: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
};

/**
 * Create optimized upload middleware with automatic image processing
 */
export function createOptimizedUpload(config: Partial<UploadConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Ensure upload directory exists
    if (!fs.existsSync(finalConfig.destination)) {
        fs.mkdirSync(finalConfig.destination, { recursive: true });
    }

    // Configure multer storage
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, finalConfig.destination);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, `${finalConfig.filePrefix}-${uniqueSuffix}${ext}`);
        },
    });

    // File filter
    const fileFilter = (req: any, file: any, cb: any) => {
        if (finalConfig.allowedTypes!.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Only images (${finalConfig.allowedTypes!.join(', ')}) are allowed`), false);
        }
    };

    // Create multer instance
    const upload = multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB initial limit (will be optimized down)
        },
        fileFilter,
    });

    /**
     * Middleware to process uploaded images after multer
     */
    const processImages = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Handle single file
            if (req.file) {
                const result = await ImageProcessor.optimizeImage(req.file.path, {
                    maxWidth: finalConfig.maxWidth,
                    quality: finalConfig.quality,
                    maxFileSize: finalConfig.maxFileSize,
                    convertToWebP: finalConfig.convertToWebP,
                });

                if (!result.success) {
                    // Clean up failed file
                    try {
                        await fs.promises.unlink(req.file.path);
                    } catch {}
                    
                    return res.status(400).json({
                        error: 'Image optimization failed',
                        details: result.error,
                    });
                }

                // Update req.file with optimized info
                req.file.path = result.optimizedPath;
                req.file.filename = path.basename(result.optimizedPath);
                req.file.size = result.optimizedSize;
                
                // Add optimization metadata
                (req.file as any).optimization = {
                    originalSize: result.originalSize,
                    optimizedSize: result.optimizedSize,
                    compressionRatio: ((1 - result.optimizedSize / result.originalSize) * 100).toFixed(2) + '%',
                    format: result.format,
                };
            }

            // Handle multiple files
            if (req.files) {
                const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
                
                // Process all files concurrently
                const results = await Promise.all(
                    files.map(file => 
                        ImageProcessor.optimizeImage(file.path, {
                            maxWidth: finalConfig.maxWidth,
                            quality: finalConfig.quality,
                            maxFileSize: finalConfig.maxFileSize,
                            convertToWebP: finalConfig.convertToWebP,
                        })
                    )
                );

                // Check for failures
                const failures = results.filter(r => !r.success);
                if (failures.length > 0) {
                    // Clean up all uploaded files
                    await Promise.all(
                        files.map(file => 
                            fs.promises.unlink(file.path).catch(() => {})
                        )
                    );

                    return res.status(400).json({
                        error: 'Some images failed to optimize',
                        details: failures.map(f => f.error),
                    });
                }

                // Update files with optimized info
                files.forEach((file, index) => {
                    const result = results[index];
                    file.path = result.optimizedPath;
                    file.filename = path.basename(result.optimizedPath);
                    file.size = result.optimizedSize;
                    
                    (file as any).optimization = {
                        originalSize: result.originalSize,
                        optimizedSize: result.optimizedSize,
                        compressionRatio: ((1 - result.optimizedSize / result.originalSize) * 100).toFixed(2) + '%',
                        format: result.format,
                    };
                });
            }

            next();
        } catch (error) {
            // Clean up files on error
            if (req.file) {
                try {
                    await fs.promises.unlink(req.file.path);
                } catch {}
            }
            
            if (req.files) {
                const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
                await Promise.all(
                    files.map(file => 
                        fs.promises.unlink(file.path).catch(() => {})
                    )
                );
            }

            next(error);
        }
    };

    return {
        single: (fieldName: string) => [upload.single(fieldName), processImages],
        array: (fieldName: string, maxCount?: number) => [upload.array(fieldName, maxCount), processImages],
        fields: (fields: multer.Field[]) => [upload.fields(fields), processImages],
        any: () => [upload.any(), processImages],
    };
}

export default createOptimizedUpload;
