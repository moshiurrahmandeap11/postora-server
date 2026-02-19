// routes/upload.js
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { uploadController } from '../controllers/uploadController.js';
import pool from '../database/db.js';
// import { authenticate } from '../middleware/auth.js'; // পরে যোগ করবেন
import { multiUpload, upload } from '../middleware/multerConfig.js';

const router = Router();

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests
    message: 'Too many uploads, please try again later'
});

// আপাতত authenticate ছাড়া
// router.use(authenticate);

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
        // আপাতত user_id ছাড়া
        const files = await pool.query(
            'SELECT * FROM files ORDER BY created_at DESC'
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