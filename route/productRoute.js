import express from 'express'
import { createProduct, deleteProduct, getAllProduct, getProductByCatSlug, getSingleProduct, patchProduct, updateProduct } from '../controllers/productController.js'
import uploadMiddleware from '../utils/upload.js'


const router = express.Router()

router.post('/create-product/:adminId', uploadMiddleware, createProduct)
router.get('/get-all-product', getAllProduct)
router.get('/get-single-product/:idOrSlug', getSingleProduct)
router.get('/get-category-product/:slug', getProductByCatSlug)
router.patch('/patch-product/:id', patchProduct)
router.delete('/delete-product/:id', deleteProduct)
router.put('/edit-product/:id', uploadMiddleware, updateProduct)

export default router;