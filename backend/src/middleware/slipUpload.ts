import { createOptimizedUpload } from './optimizedUpload';

export const slipUpload = createOptimizedUpload({
    destination: 'uploads/slips',
    filePrefix: 'slip',
    maxFileSize: 500 * 1024,
    maxWidth: 1200,
    quality: 75,
    convertToWebP: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
});
