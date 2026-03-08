import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { ImageProcessor } from '../services/imageProcessor';

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = 'uploads/snakes/customer';
        const type = req.query.type;

        if (type === 'admin') dir = 'uploads/snakes/admin';
        else if (type === 'article') dir = 'uploads/articles';
        else if (type === 'customer') dir = 'uploads/snakes/customer';

        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = req.query.type === 'article' ? 'article' : 'snake';
        cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
});

const processSnakeImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.file) {
            console.log(`Processing single file: ${req.file.path}`);
            const result = await ImageProcessor.optimizeImage(req.file.path, {
                maxWidth: 1200,
                quality: 75,
                maxFileSize: 500 * 1024,
                convertToWebP: true,
            });

            if (!result.success) {
                console.warn('Image optimization failed, using original file:', result.error);
                // Keep the original original size/path/etc. if optimization failed
            } else {
                req.file.path = result.optimizedPath;
                req.file.filename = path.basename(result.optimizedPath);
                req.file.size = result.optimizedSize;

                (req.file as any).optimization = {
                    originalSize: result.originalSize,
                    optimizedSize: result.optimizedSize,
                    compressionRatio: ((1 - result.optimizedSize / result.originalSize) * 100).toFixed(2) + '%',
                    format: result.format,
                };
            }
        }

        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            console.log(`Processing bulk files: ${files.length} items`);

            const results = await Promise.all(
                files.map(file =>
                    ImageProcessor.optimizeImage(file.path, {
                        maxWidth: 1200,
                        quality: 75,
                        maxFileSize: 500 * 1024,
                        convertToWebP: true,
                    })
                )
            );

            files.forEach((file, index) => {
                const result = results[index];
                if (!result.success) {
                    console.warn(`Optimization failed for file ${file.path}, using original. Error:`, result.error);
                } else {
                    file.path = result.optimizedPath;
                    file.filename = path.basename(result.optimizedPath);
                    file.size = result.optimizedSize;

                    (file as any).optimization = {
                        originalSize: result.originalSize,
                        optimizedSize: result.optimizedSize,
                        compressionRatio: ((1 - result.optimizedSize / result.originalSize) * 100).toFixed(2) + '%',
                        format: result.format,
                    };
                }
            });
        }

        next();
    } catch (error) {
        console.error('Error in processSnakeImages middleware:', error);
        if (req.file) {
            try {
                console.log('Attempting to unlink failed file:', req.file.path);
                await fs.promises.unlink(req.file.path);
            } catch (unlinkErr) {
                console.error('Failed to unlink file after error:', unlinkErr);
            }
        }

        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            await Promise.all(
                files.map(async file => {
                    try {
                        console.log('Attempting to unlink failed file (bulk):', file.path);
                        await fs.promises.unlink(file.path);
                    } catch (unlinkErr) {
                        console.error('Failed to unlink file after error (bulk):', unlinkErr);
                    }
                })
            );
        }

        next(error);
    }
};

export const snakeUpload = {
    single: (fieldName: string) => [upload.single(fieldName), processSnakeImages],
    array: (fieldName: string, maxCount?: number) => [upload.array(fieldName, maxCount), processSnakeImages],
};
