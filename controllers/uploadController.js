import fs from "fs";
import path from "path";
import { UPLOAD_CONFIG } from "../config/upload";
import pool from "../database/db";
import { FileHelper } from "../utils/fileHelper";

export const uploadController = {
    // single file upload
    async uploadSingle(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded"
                });
            }

            const file = req.file;
            const fileType = FileHelper.detectFileType(file.mimetype);

            // image optimzation
            if(fileType === "image" && UPLOAD_CONFIG.image.compress.enabled) {
                const optimizedPath = path.join(
                    path.dirname(file.path),
                    'optimized-' + path.basename(file.path)
                );

                await FileHelper.optimizeImage(file.path, optimizedPath, {
                    quality: UPLOAD_CONFIG.image.compress.quality
                });

                // original file delete and use optimized image
                await fs.promises.unlink(file.path);
                file.path = optimizedPath;
            }

            // save to database
            const result = await pool.query(
                `INSERT INTO files
                (original_name, file_name, file_path, file_size, mime_type, file_type, user_id)
                VALUES ( $1, $2, $3, $4, $5, $6, $7)
                RETURNING *
                `,
                [
                    file.originalname,
                    file.filename,
                    file.path,
                    file.size,
                    file.mimetype,
                    fileType,
                    req.user?.id || null
                ]
            );

            res.status(201).json({
                success: true,
                message: "File uploaded successfully",
                data: {
                    id: result.rows[0].id,
                    originalName: file.originalname,
                    fileName: file.filename,
                    fileSize: FileHelper.formatBytes(file.size),
                    fileType: fileType,
                    url: `/uploads/${fileType}/${file.filename}`,
                    thumbnail: fileType === "video" ? `/thumbnails/${file.filename}.jpg` : null
                }
            });
        } catch (error) {
            console.error("Upload error", error);
            
            // if upload failed then delete the file 
            if(req.file?.path) {
                await fs.promises.unlink(req.file.path).catch(() =>{});
            }

            res.status(500).json({
                success: false,
                message: error.message || "upload failed"
            });
        }
    },


    // multiple file upload
    async uploadMultiple(req, res) {
        try {
            if(!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No files uploaded"
                });
            }

            const uploadDir = [];

            // all file process
            for (const [fieldName, files] of Object.entries(req.files)) {
                for (const file of files) {
                    const fileType = FileHelper.detectFileType(file.mimetype);

                    // save to db
                    const result = await pool.query(
                        `INSERT INTO files (...) VALUES (...) RETURNING *`,
                        [file.originalname, file.filename, file.path, file.size, file.mimetype, fileType, req.user?.id]
                    );

                    uploadedFiles.push({
                        id: result.rows[0].id,
                        originalName: file.originalname,
                        url: `/uploads/${fileType}/${file.filename}`
                    });
                }
            }

            res.status(201).json({
                success: true,
                message: `${uploadedFiles.length} files upload successfully`,
                data: uploadedFiles
            });
        } catch (error) {
            console.error("Multiple upload error: ", error);
            
            // if fail then delete files
            if(req.files) {
                for (const files of Object.values(req.files)) {
                    for (const file of files) {
                        await fs.promises.unlink(file.path).catch(() => {});
                    }
                }
            }

            res.status(500).json({
                success: false,
                message: "Upload failed"
            });
        }
    },

    // file delete
    async deleteFile(req, res) {
        try {
            const {id} = req.params;

            // file form db
            const file = await pool.query(
                "SELECT * FROM files WHERE id = $1", [id]
            );

            if(file.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "File not found"
                });
            }

            // file delete 
            await fs.promises.unlink(file.rows[0].file_path).catch(() => {});

            // delete from db
            await pool.query("DELETE FROM files WHERE id = $1", [id]);

            res.status(200).json({
                success: true,
                message: "file deleted successfully"
            });
        } catch (error) {
            console.error("Delete error", error);
            res.status(500).json({
                success: false,
                message: "Delete Failed",
            });
        }
    }
};