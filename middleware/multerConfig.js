import multer from "multer";
import path from "path";
import { UPLOAD_CONFIG } from "../config/upload.js";
import { FileHelper } from "../utils/fileHelper.js";

// storage configuration
const storage = multer.diskStorage({
    destination: async (req, file , cb) => {
        const fileType = FileHelper.detectFileType(file.mimetype);
        const uploadPath = path.join(
            process.cwd(),
            UPLOAD_CONFIG.localPath[fileType] || "uploads/others"
        );

        await FileHelper.ensureDir(uploadPath);
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const fileName = FileHelper.generateFileName(file.originalname);
        cb(null, fileName);
    }
});

// file filter
const fileFilter = (req, file, cb) => {
    const fileType = FileHelper.detectFileType(file.mimetype);
    const config = UPLOAD_CONFIG[fileType];

    if(!config) {
        return cb(new Error("Unsupported file type"), false);
    }

    if(!config.allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }

    cb(null, true);
};

// multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 , // 100MB default max
    }
});


// multiple file upload
export const multiUpload = upload.fields([
    {name: "image", maxCount: 10},
    {name: "vidoes", maxCount: 3},
    {name: "documents", maxCount: 5}
]);