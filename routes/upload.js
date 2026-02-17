// routes/upload.js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { uploadController } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { multiUpload, upload } from '../middleware/multerConfig.js';

const router = Router();


const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests
    message: 'Too many uploads, please try again later'
});


router.use(authenticate);


router.post(
    '/single', 
    uploadLimiter,
    upload.single('file'),
    uploadController.uploadSingle
);


router.post(
    '/multiple',
    uploadLimiter,
    multiUpload,
    uploadController.uploadMultiple
);


router.delete('/:id', uploadController.deleteFile);


router.get('/list', async (req, res) => {
    try {
        const files = await pool.query(
            'SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        
        res.status(200).json({
            success: true,
            data: files.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch files' });
    }
});

export default router;