import dotenv from "dotenv";
dotenv.config();
export const UPLOAD_CONFIG = {
    // image config
    image: {
        maxSize: 10 * 1024 * 1024, // 10 MB
        allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"],
        dimensions: {
            maxWidth: 4096,
            maxHeight: 4096,
        },
        compress: {
            enabled: true,
            quality: 80, // 80%
        }
    },

    // video config
    video: {
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedTypes: ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"],
        thumbnail: true,
        maxDuration: 600, // 10 minutes in seconds
    },

    // doc config
    document: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain"
        ],
    },

    // storage type 
    storage: process.env.STORAGE_TYPE,

    // local storage path
    localPath: {
        image: "uploads/images",
        video: "uploads/videos",
        document: "uploads/documents",
        temp: "uploads/temp",
    }
};