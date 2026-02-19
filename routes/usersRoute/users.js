import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../../database/db.js";
import { upload } from "../../middleware/multerConfig.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const saltRounds = 10;

// get all users from postgres db
router.get("/", async(req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email, role, profile_picture_url, created_at, updated_at from users");
        if(result.rows.length === 0) {
            return res.status(400).json({
                success: true,
                message: "no user found on database",
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: "users successfully fetched from db",
            data: result.rows,
        });
    } catch (error) {
        console.error("users fetching failed: ", error);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    };
});


// signup a new user
router.post("/signup", async(req, res) => {
    try {
        const {name, email, password} = req.body;
        if(!name) {
            return res.status(400).json({
                success: false,
                message: "name required",
            });
        };

        if(!email) {
            return res.status(400).json({
                success: false,
                message: "email required",
            });
        };

        if(!password) {
            return res.status(400).json({
                success: false,
                message: "password required",
            });
        };


        // check user if exists in db
        const check_user = await pool.query("select * from users where email = $1", [email.toLowerCase()]);

        if(check_user.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `user already exists with this email ${email}`,
            });
        };

        // generate hash password for hashing using bcrypt
        const hash_password = await bcrypt.hash(password, saltRounds);
        const role = "user";

        const result = await pool.query("INSERT INTO users (name, email , role , password) values ( $1, $2, $3, $4) RETURNING *", [name.trim(), email.toLowerCase(), role , hash_password]);

        if(result.rowCount === 0) {
            return res.status(500).json({
                success: false,
                message: "something went wrong - user creation failed",
            });
        };

        res.status(200).json({
            success: true,
            message: "user created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("user creation failed: ", error);
        res.status(500).json({
            success: false,
            message: "internal server error",
        });
    };
});


// signin a user 
router.post("/signin", async(req, res) => {
    try {
        const {email, password} = req.body;
        if(!email) {
            return res.status(400).json({
                success: false,
                message: "email required for sign in"
            });
        };

        if(!password) {
            return res.status(400).json({
                success: false,
                message: "password required for sign in"
            });
        };


        // check user for make sure exists on db
        const check_user = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
        if(check_user.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: `user not exists with this email ${email}`
            });
        };

        const user = check_user.rows[0];

        // hashing password for comparing with stored hash
        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password Wrong",
            });
        };

        // generate jwt token for security
        const token = jwt.sign(
            {id: user.id, email: user.email}, process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES},
        )

        res.status(200).json({
            success: true,
            message: "user sign in successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at,
            }
        });
    } catch (error) {
        console.error("user sign in failed :", error);
        res.status(500).json({
            success: false,
            message: "internal server error",
        });
    };
});


// profile picture upload
router.patch("/profile-picture", upload.single("profile_picture"), async(req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        };

        const userId = req.user.id;
        const file= req.file;

        // create url
        const baseUrl = process.env.BASE_URL;
        const profilePictureUrl = `${baseUrl}/uploads/images/${file.filename}`;

        // delete the old profile if exists
        const oldProfile = await pool.query(
            `SELECT profile_picture FROM users WHERE id = $1`, [userId]
        );

        if(oldProfile.rows[0]?.profile_picture) {
            const oldPath = path.join(process.cwd(), 'uploads/images', oldProfile.rows[0].profile_picture);
            if(fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // update the db
        const result = await pool.query(
            `UPDATE users
            SET profile_picture = $1,
            profile_picture_url = $2,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, name, email, profile_picture, profile_picture_url
            `, [file.filename, profilePictureUrl, userId]
        );

        res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Profile picture upload failed: ", error);
        
        // if error then delete the file
        if(req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Failed to upload profile picture"
        });
    }
});


// delete profile picture
router.delete("/profile-picture", async(req, res) => {
    try {
        const userId = req.user.id;

        // take user profile info
        const user = await pool.query(
            "SELECT profile_picture FROM users WHERE id = $1", [userId]
        );

        if(!user.rows[0]?.profile_picture) {
            return res.status(404).json({
                success: false,
                message: "No profile picture found"
            });
        }

        // delete the file
        const filePath = path.join(process.cwd(), 'uploads/images', user.rows[0].profile_picture);
        if(fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }


        // update the database
        await pool.query(
            `UPDATE users
            SET profile_picture = NULL,
            profile_picture_url = NULL,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `, [userId]
        );


        res.status(200).json({
            success: true,
            message: "Profile picture deleted successfully"
        });
    } catch (error) {
        console.error("Profile picture deletion failed: ", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete profile picture"
        });
    }
});


// get a user by ID
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({
                success: false,
                message: "ID required",
            });
        };

        const result = await pool.query("SELECT id, name, email, role, updated_at, created_at FROM users WHERE id = $1", [id]);

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `user not exists with id ${id}`
            });
        };

        res.status(200).json({
            success: true,
            message: "user fetched successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("user fetching failed :", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    };
});


// get a user by email 
router.get("/email/:email", async(req, res) => {
    try {
        const {email} = req.params;
        if(!email) {
            return res.status(400).json({
                success: false,
                message: "Email required",
            });
        };

        const result = await pool.query("SELECT id, name, email, role, created_at, updated_at FROM users WHERE email = $1", [email.toLowerCase()]);

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `user not found with email ${email}`
            });
        };

        res.status(200).json({
            success: true,
            message: "user fetched successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("user fetching failed :", error);
        res.status(500).json({
            success: false,
            message: "internal server error",
        });
    };
});


// update user data with patch by ID
router.patch("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const {name, email , old_password, new_password, confirm_new_password} = req.body;
        if(!id) {
            return res.status(400).json({
                success: false,
                message: "ID required",
            });
        };

        // users exists check
        const user_result = await pool.query("SELECT * FROM users where id = $1", [id]);

        if(user_result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        };

        const user = user_result.rows[0];

        // build query dynamically
        const fields = [];
        const values = [];
        let index = 1;

        // name update
        if(name) {
            fields.push(`name = $${index++}`);
            values.push(name.trim());
        }

        // email update
        if(email) {
            // email must be unique
            const email_check = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $1", [email.toLowerCase(), id])
            if(email_check.rows.length > 0 ) {
                return res.status(409).json({
                    success: false,
                    message: "Email already in use",
                });
            };
    
            fields.push(`email = $${index++}`);
            values.push(email.toLowerCase());
            
        };

        // password update
        if(new_password || confirm_new_password || old_password) {
            if(!old_password) {
                return res.status(400).json({
                    success: false,
                    message: "Old password required to change password",
                });
            };

            // password matching with hash
            const isMatch = await bcrypt.compare(old_password, user.password);
            if(!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Incorrect old password",
                });
            };

            if(!new_password || !confirm_new_password) {
                return res.status(400).json({
                    success: false,
                    message: "New password and confirmation required",
                });
            };

            if(new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters",
                });
            };

            if(await bcrypt.compare(new_password, user.password)) {
                return res.status(400).json({
                    success: false,
                    message: "New password cannot be same as old password",
                });
            };

            const new_hash_password = await bcrypt.hash(new_password, saltRounds);
            fields.push(`password = $${index++}`);
            values.push(new_hash_password);

        }

        if(fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields to update",
            });
        }


        values.push(id);

        // single query 
        const query = `
        UPDATE users
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${index}
        RETURNING id, name, email, role, created_at, updated_at
        `;

        const updateUser = await pool.query(query, values);

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updateUser.rows[0],
        });

    } catch (error) {
        console.error("user update failed : ", error);
        res.status(500).json({
            success: false,
            message: "internal server error",
        })
    }
})


// delete user by ID
router.delete("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        console.log("delete id", id);
        if(!id) {
            return res.status(400).json({
                success: false,
                message: "ID required",
            });
        };

        // user exists
        const check_user = await pool.query("SELECT * FROM users WHERE id = $1", [id])
        if(check_user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            })
        }


        const user_deletation = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, name, email ", [id]);

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: user_deletation.rows[0],
        })
    } catch (error) {
        console.error("user delation failed : ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    };
});




export default router;