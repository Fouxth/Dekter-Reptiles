import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface OptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxFileSize?: number; // in bytes
    convertToWebP?: boolean;
}

interface OptimizationResult {
    success: boolean;
    originalPath: string;
    optimizedPath: string;
    originalSize: number;
    optimizedSize: number;
    format: string;
    error?: string;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
    maxWidth: 1200,
    quality: 75,
    maxFileSize: 500 * 1024, // 500KB
    convertToWebP: true,
};

/**
 * Image Processor Service
 * Handles automatic image optimization for uploaded files
 */
export class ImageProcessor {
    /**
     * Optimize a single image file
     */
    static async optimizeImage(
        filePath: string,
        options: OptimizationOptions = {}
    ): Promise<OptimizationResult> {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        
        try {
            // Validate file exists
            const fileExists = await this.fileExists(filePath);
            if (!fileExists) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Get original file stats
            const originalStats = await fs.stat(filePath);
            const originalSize = originalStats.size;

            // Validate it's an image
            const isValidImage = await this.isValidImage(filePath);
            if (!isValidImage) {
                throw new Error('File is not a valid image');
            }

            // Load image with sharp
            let image = sharp(filePath);
            const metadata = await image.metadata();

            // Resize if needed (maintain aspect ratio)
            if (metadata.width && opts.maxWidth && metadata.width > opts.maxWidth) {
                image = image.resize(opts.maxWidth, null, {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }

            // Determine output format and path
            const ext = path.extname(filePath);
            const baseName = path.basename(filePath, ext);
            const dirName = path.dirname(filePath);
            
            let outputPath: string;
            let outputFormat: string;

            if (opts.convertToWebP) {
                outputPath = path.join(dirName, `${baseName}.webp`);
                outputFormat = 'webp';
                image = image.webp({ quality: opts.quality || 75 });
            } else {
                outputPath = filePath;
                outputFormat = metadata.format || 'jpeg';
                
                // Apply format-specific optimization
                switch (metadata.format) {
                    case 'jpeg':
                    case 'jpg':
                        image = image.jpeg({ quality: opts.quality || 70, progressive: true });
                        break;
                    case 'png':
                        image = image.png({ compressionLevel: 9, progressive: true });
                        break;
                    case 'webp':
                        image = image.webp({ quality: opts.quality || 75 });
                        break;
                    default:
                        // Convert unknown formats to JPEG
                        image = image.jpeg({ quality: opts.quality || 70 });
                        outputFormat = 'jpeg';
                }
            }

            // Save optimized image to temp location first
            const tempPath = `${outputPath}.tmp`;
            await image.toFile(tempPath);

            // Check file size
            let finalStats = await fs.stat(tempPath);
            let finalSize = finalStats.size;

            // If still too large, reduce quality iteratively
            if (opts.maxFileSize && finalSize > opts.maxFileSize) {
                let quality = opts.quality || 75;
                const minQuality = 40;
                
                while (finalSize > opts.maxFileSize && quality > minQuality) {
                    quality -= 10;
                    
                    // Reload and reprocess
                    image = sharp(filePath);
                    
                    if (metadata.width && opts.maxWidth && metadata.width > opts.maxWidth) {
                        image = image.resize(opts.maxWidth, null, {
                            fit: 'inside',
                            withoutEnlargement: true,
                        });
                    }

                    if (opts.convertToWebP) {
                        image = image.webp({ quality });
                    } else {
                        switch (metadata.format) {
                            case 'jpeg':
                            case 'jpg':
                                image = image.jpeg({ quality, progressive: true });
                                break;
                            case 'png':
                                // PNG doesn't have quality, try converting to WebP
                                image = image.webp({ quality });
                                outputFormat = 'webp';
                                outputPath = path.join(dirName, `${baseName}.webp`);
                                break;
                            case 'webp':
                                image = image.webp({ quality });
                                break;
                        }
                    }

                    await image.toFile(tempPath);
                    finalStats = await fs.stat(tempPath);
                    finalSize = finalStats.size;
                }
            }

            // Move temp file to final location
            await fs.rename(tempPath, outputPath);

            // Delete original file if it's different from output
            if (filePath !== outputPath) {
                await fs.unlink(filePath);
            }

            return {
                success: true,
                originalPath: filePath,
                optimizedPath: outputPath,
                originalSize,
                optimizedSize: finalSize,
                format: outputFormat,
            };

        } catch (error) {
            return {
                success: false,
                originalPath: filePath,
                optimizedPath: filePath,
                originalSize: 0,
                optimizedSize: 0,
                format: 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Optimize multiple images concurrently
     */
    static async optimizeImages(
        filePaths: string[],
        options: OptimizationOptions = {}
    ): Promise<OptimizationResult[]> {
        const promises = filePaths.map(filePath => 
            this.optimizeImage(filePath, options)
        );
        
        return Promise.all(promises);
    }

    /**
     * Check if file exists
     */
    private static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate if file is a valid image
     */
    private static async isValidImage(filePath: string): Promise<boolean> {
        try {
            const metadata = await sharp(filePath).metadata();
            return !!(metadata.format && metadata.width && metadata.height);
        } catch {
            return false;
        }
    }

    /**
     * Get image metadata without processing
     */
    static async getImageInfo(filePath: string) {
        try {
            const metadata = await sharp(filePath).metadata();
            const stats = await fs.stat(filePath);
            
            return {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                size: stats.size,
                hasAlpha: metadata.hasAlpha,
            };
        } catch (error) {
            throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export default ImageProcessor;
