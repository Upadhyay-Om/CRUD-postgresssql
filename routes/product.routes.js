import express from "express";
import { getProducts,getProduct,createProduct,deleteProduct,updateProduct } from "../controllers/product.controllers.js";

const router = express.Router();


router.get('/', getProducts);
router.get('/:id',getProduct);
router.post('/',createProduct)
router.delete('/:id',deleteProduct);
router.put('/:id',updateProduct);

export default router;