import { Router } from "express";
import pool from "../../database/db.js";

const router = Router();

// get all projects
router.get("/", async(req, res) => {
    try {
        const projects = await pool.query("SELECT * FROM projects");
        if(projects.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No projects found",
                data: [],
            });
        };

        res.status(200).json({
            success: true,
            messages: "Projects retrieved successfully",
            data: projects.rows,
        })
    } catch (error) {
        console.error("Projects retrieved failed :", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving projects",
        })
    }
});


// get a project by id
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({
                success: false,
                message: "Project id is required",
            })
        };

        const project = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);

        if(project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        };

        res.status(200).json({
            success: true,
            message: "Project retrieved successfully",
            data: project.rows[0],
        })
    } catch (error) {
        console.error("single project retrieving failed: ",error);
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the project",
        })
    }
});


// create a project
router.post("/", async(req, res) => {
    try {
        const {title, slug, short_description, full_description, thumbnail_url, live_url, github_url, category, status , featured} = req.body;

        if(!title || !slug || !short_description || !full_description || !thumbnail_url || !live_url || !github_url || !category || !status) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        };

        const newProject = await pool.query(
            "INSERT INTO projects (title, slug, short_description, full_description, thumbnail_url, live_url, github_url, category, status, featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [title, slug, short_description, full_description, thumbnail_url, live_url, github_url, category, status , featured]
        );
        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: newProject.rows[0],
        })
    } catch (error) {
        console.error("Project creation failed: ", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the project",
        })
    }
})


// update a project
router.patch("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const {title, slug, short_description, full_description, thumbnail_url, live_url, github_url, category, status , featured} = req.body;

        if(!id) {
            return res.status(400).json({
                success: false,
                message: "Project id is required",
            })
        };

        const project = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
        if(project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            })
        };

        const updatedProject = await pool.query(
            "UPDATE projects SET title = $1, slug = $2, short_description = $3, full_description = $4, thumbnail_url = $5, live_url = $6, github_url = $7, category = $8, status = $9 , featured = $10 WHERE id = $11 RETURNING *",
            [title || project.rows[0].title, slug || project.rows[0].slug, short_description || project.rows[0].short_description, full_description || project.rows[0].full_description, thumbnail_url || project.rows[0].thumbnail_url, live_url || project.rows[0].live_url, github_url || project.rows[0].github_url, category || project.rows[0].category, status || project.rows[0].status , featured || project.rows[0].featured , id]
        );

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: updatedProject.rows[0],
        })
    } catch (error) {
        console.error("Project update failed: ", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the project",
        })
    }
});


// delete a project
router.delete("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({
                success: false,
                message: "Project id is required",
            })
        };

        const project = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
        if(project.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            })
        };

        await pool.query("DELETE FROM projects WHERE id = $1", [id]);
        res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        })
    } catch (error) {
        console.error("Project deletion failed: ", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the project",
        })
    }
});


export default router;