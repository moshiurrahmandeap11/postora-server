// utils/fileHelper.js
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const FileHelper = {
    // ফাইল টাইপ ডিটেক্ট করুন
    detectFileType: (mimetype) => {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype.startsWith('audio/')) return 'audio';
        return 'document';
    },

    // ইউনিক ফাইলনেম জেনারেট করুন
    generateFileName: (originalName) => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const extension = path.extname(originalName);
        return `${timestamp}-${random}${extension}`;
    },

    // ডিরেক্টরি চেক/ক্রিয়েট করুন
    ensureDir: async (dirPath) => {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    },

    // ইমেজ অপ্টিমাইজ করুন
    optimizeImage: async (inputPath, outputPath, options = {}) => {
        const { quality = 80 } = options;
        
        await sharp(inputPath)
            .jpeg({ quality, mozjpeg: true })
            .toFile(outputPath);
    },

    // ফাইল সাইজ ফরম্যাট করুন
    formatBytes: (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};