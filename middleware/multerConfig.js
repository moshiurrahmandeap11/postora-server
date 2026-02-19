// middleware/multerConfig.js
import multer from "multer";
import path from "path";
import { UPLOAD_CONFIG } from "../config/upload.js";
import { FileHelper } from "../utils/fileHelper.js"; // ✅ এই import ঠিক আছে

// storage configuration
const storage = multer.diskStorage({
    destination: async (req, file , cb) => {
        try {
            const fileType = FileHelper.detectFileType(file.mimetype);
            const uploadPath = path.join(
                process.cwd(),
                UPLOAD_CONFIG.localPath[fileType] || "uploads/others"
            );

            await FileHelper.ensureDir(uploadPath);  // ✅ এখন কাজ করবে
            cb(null, uploadPath);
        } catch (error) {
            cb(error, null);
        }
    },

    filename: (req, file, cb) => {
        try {
            const fileName = FileHelper.generateFileName(file.originalname);
            cb(null, fileName);
        } catch (error) {
            cb(error, null);
        }
    }
});

// file filter
const fileFilter = (req, file, cb) => {
    try {
        const fileType = FileHelper.detectFileType(file.mimetype);
        const config = UPLOAD_CONFIG[fileType];

        if(!config) {
            return cb(new Error("Unsupported file type"), false);
        }

        if(!config.allowedTypes.includes(file.mimetype)) {
            return cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }

        cb(null, true);
    } catch (error) {
        cb(error, false);
    }
};

// multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 , // 100MB default max
    }
});


// multiple file upload - টাইপো fix করুন
export const multiUpload = upload.fields([
    {name: "images", maxCount: 10},  // "image" -> "images"
    {name: "videos", maxCount: 3},   // "vidoes" -> "videos"
    {name: "documents", maxCount: 5}
]);