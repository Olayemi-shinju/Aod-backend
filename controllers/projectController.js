import projects from "../models/projectModel.js";
import { v2 as cloudinary } from "cloudinary";

// Upload Project Controller
export const uploadProject = async (req, res) => {
    try {
        const { name } = req.body;
        const adminId = req.user?._id;

        if (!adminId) {
            return res.status(404).json({ success: false, msg: "Admin ID not found" });
        }

        if (!req.files || !req.files.project || req.files.project.length === 0) {
            return res.status(400).json({ success: false, msg: "At least one image is required" });
        }

        const cloudinaryResults = [];

        for (const file of req.files.project) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "projects"
            });

            cloudinaryResults.push({
                url: result.secure_url,
                public_id: result.public_id
            });
        }

        const imagePaths = cloudinaryResults.map((item) => item.url);
        const publicIds = cloudinaryResults.map((item) => item.public_id);

        const projectData = new projects({
            name,
            project: imagePaths,
            projectPublicId: publicIds,
            uploadedBy: adminId
        });

        const savedProject = await projectData.save();

        res.status(201).json({
            success: true,
            msg: "Project uploaded successfully",
            data: savedProject
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, msg: "An error occurred" });
    }
};

// Update Project Controller
export const updateProject = async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, msg: 'Project ID is required' });
        }

        const existingProject = await projects.findById(id);
        if (!existingProject) {
            return res.status(404).json({ success: false, msg: 'Project not found' });
        }

        const updatedData = { name };

        // Handle image replacement
        if (req.files && req.files.project && req.files.project[0]) {
            // Delete existing images from Cloudinary
            if (existingProject.projectPublicId && existingProject.projectPublicId.length > 0) {
                for (const publicId of existingProject.projectPublicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            // Upload new image
            const newUpload = await cloudinary.uploader.upload(req.files.project[0].path, {
                folder: "projects"
            });

            updatedData.project = [newUpload.secure_url];
            updatedData.projectPublicId = [newUpload.public_id];
        }

        const updatedProject = await projects.findByIdAndUpdate(id, updatedData, { new: true });

        res.status(200).json({ success: true, msg: 'Project updated successfully', data: updatedProject });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};

// Delete Project Controller
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, msg: 'Project ID is required' });
        }

        const project = await projects.findById(id);
        if (!project) {
            return res.status(404).json({ success: false, msg: 'Project not found' });
        }

        // Delete from Cloudinary
        if (project.projectPublicId && project.projectPublicId.length > 0) {
            for (const publicId of project.projectPublicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        await projects.findByIdAndDelete(id);

        const remainingProjects = await projects.find().select('-__v');

        res.status(200).json({ success: true, msg: 'Deleted successfully', data: remainingProjects });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};

// Get Projects Controller
export const getProject = async (req, res) => {
    try {
        const allProjects = await projects.find();
       

        res.status(200).json({ success: true, msg: 'Successfully retrieved', data: allProjects });
    } catch (error) {
        console.error("Get error:", error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};
