import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../../database/db.js";

const router = Router();
const saltRounds = 10;

// get all users from postgres db
router.get("/", async(req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email, role, created_at, updated_at from users");
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

export default router;