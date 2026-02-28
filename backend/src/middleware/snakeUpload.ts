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
        const type = req.query.type === 'admin' ? 'admin' : 'customer';
        const dir = `uploads/snakes/${type}`;
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'snake-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images (jpg, jpeg, png, webp) are allowed'), false);
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
            const result = await ImageProcessor.optimizeImage(req.file.path, {
                maxWidth: 1200,
                quality: 75,
                maxFileSize: 500 * 1024,
                convertToWebP: true,
            });

            if (!result.success) {
                try {
                    await fs.promises.unlink(req.file.path);
                } catch {}
                
                return res.status(400).json({
                    error: 'Image optimization failed',
                    details: result.error,
                });
            }

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

        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
            
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

            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
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

export const snakeUpload = {
    single: (fieldName: string) => [upload.single(fieldName), processSnakeImages],
    array: (fieldName: string, maxCount?: number) => [upload.array(fieldName, maxCount), processSnakeImages],
};
