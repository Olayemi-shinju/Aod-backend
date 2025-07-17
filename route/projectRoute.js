import express from 'express';
import uploadMiddleware from '../utils/upload.js';
import { deleteProject, getProject, updateProject, uploadProject } from '../controllers/projectController.js';
import { authorized, protect } from '../middlewares/authMiddleware.js';
const router = express.Router()


router.post('/upload-project', uploadMiddleware, protect, authorized('admin'),  uploadProject);
router.put('/update-project/:id', uploadMiddleware, updateProject);
router.delete('/delete-project/:id', deleteProject);
router.get('/get-project', getProject);

export default router;