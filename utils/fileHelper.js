import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export class FileHelper {
    // file type detect
    static detectFileType(mimetype) {
        if(mimetype.startsWith("image/")) return "image";
        if (mimetype.startsWith("video/")) return "video";
        if(mimetype.startsWith("audio")) return "audio";
        return "document";
    }

    // unique filename generation
    static generateFileName(originalName) {
        const timestamp = Date.now();
        const uuid = uuidv4().split('-')[0];
        const extension = path.extname(originalName);
        return `${timestamp}-${uuid}${extension}`;
    }

    // image optimization
    static async optimizeImage(inputPath, outpuptPath, options  = {}) {
        const {width, height, quality = 80} = options;

        let pipeline = sharp(inputPath);

        if(width || height) {
            pipeline = pipeline.resize(width, height, {
                fit: "inside",
                withoutEnlargement: true
            });
        }

        await pipeline.jpeg({quality, mozjpeg: true}).toFile(outpuptPath);
    }

    // file size formatation
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '' + sizes[i];
    }

    // malicious content check
    static async scanForMalware(filePath) {
        // to be updated for malware scanner api
        // such as ClamAV,VirusTotal etc
        return true;
    }
}