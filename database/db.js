import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const {Pool} = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});


export const connectDB = async() => {
    try {
        const client = await pool.connect();
        console.log("postgres connected successfully");
        client.release();
    } catch (error) {
        console.log("postgres connection failed");
        process.exit(1)
    }
}

export default pool;