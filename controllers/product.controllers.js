import pkg from 'pg';
import {z} from 'zod';
import { fromZodError } from 'zod-validation-error';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ 
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
// make zod schema
const createProductSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
    price: z.number().positive("Price must be positive"),
    quantity: z.number().int().nonnegative("Quantity must be non-negative"),
    image: z.string().url("Invalid URL").optional().or(z.literal(''))
});

const updateProductSchema = createProductSchema.partial();

const queryParamsSchema = z.object({
    page : z.coerce.number().int().min(1,"Page must be at least 1").optional(),
    limit : z.coerce.number().int().positive("Limit must be a positive integer").min(1).max(100).optional(),
    name : z.string().optional(),
    minPrice: z.coerce.number().nonnegative("Min price must be non-negative").optional(),
    maxPrice: z.coerce.number().nonnegative("Max price must be non-negative").optional()
}).refine(
    (data) => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
    { message: "Min price must be less than or equal to max price", path: ["minPrice"] }    
)
const paramsSchema = z.object({
    id: z.string().uuid("Invalid product ID"),
});

const getProducts = async (req,res) => {
    try {
        const queryValidation = queryParamsSchema.safeParse(req.query);
        if(!queryValidation.success){
            const validationError = fromZodError(queryValidation.error);
            return res.status(400).json({
                message: 'Invalid query parameters',
                errors: validationError.errors
            })
        }
        // Extract pagination parameters
        const { page = 1, limit = 10, name, minPrice, maxPrice } = queryValidation.data;
        const offset = (page - 1) * limit;

        // Build dynamic query based on filters
        let whereConditions = [];
        let queryParams = [];
        let paramCount = 1;

        if (name){
            whereConditions.push(`name ILIKE $${paramCount}`);
            queryParams.push(`%${name}%`);
            paramCount++;
        }
        if (minPrice !== undefined){
            whereConditions.push(`price >= $${paramCount}`);
            queryParams.push(minPrice);
            paramCount++;
        }
        if (maxPrice !== undefined){
            whereConditions.push(`price <= $${paramCount}`);
            queryParams.push(maxPrice);
            paramCount++;
        }
        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count for pagination
        const [countResult, dataResult] = await Promise.all([
            pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, queryParams),
            pool.query(
                `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
                [...queryParams, limit, offset]
            )
        ]);
        const totalProducts = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);
            res.status(200).json({
            products: dataResult.rows,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    }catch (error) {
        res.status(500).json({message: 'Server Error'});
    }
}
const getProduct = async (req,res) => {
    try {
        const paramsValidation = paramsSchema.safeParse(req.params);
        if(!paramsValidation.success){
            const validationError = fromZodError(paramsValidation.error);
            return res.status(400).json({
                message: 'Invalid URL parameters',
                errors: validationError.errors
            })
        }
        const { id } = paramsValidation.data;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]); 
        if(result.rows.length === 0){
            res.status(404).json({message:"product Not Found"});
            return;
        }
        res.status(200).json(result.rows[0]);
    }catch (error) {
        res.status(500).json({message: 'Server Error'});
    }
}

const createProduct = async (req, res) => {
    try {
        const bodyValidation = createProductSchema.safeParse(req.body);
        if(!bodyValidation.success){
            const validationError = fromZodError(bodyValidation.error);
            return res.status(400).json({
                message: 'Invalid request body',
                errors: validationError.errors
            })
        }
        const { name, price, quantity, image } = bodyValidation.data;
        const result = await pool.query(
            'INSERT INTO products (name, price, quantity, image) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, price, quantity, image || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server Error'});
    }
};

const deleteProduct = async (req,res) => {
    try {
       const paramsValidation = paramsSchema.safeParse(req.params);
         if(!paramsValidation.success){
            const validationError = fromZodError(paramsValidation.error);
            return res.status(400).json({
                message: 'Invalid URL parameters',
                errors: validationError.errors
            })
        }
        const { id } = paramsValidation.data;
       const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
       if(result.rows.length === 0){
            res.status(404).json({message:"product Not Found"});
            return;
        }
        res.status(200).json(result.rows[0]);
    }catch (error){
        res.status(500).json({message: 'Server Error'});
    }
}
const updateProduct = async (req,res) => {
    try {
        const paramsValidation = paramsSchema.safeParse(req.params);
        if(!paramsValidation.success){
            const validationError = fromZodError(paramsValidation.error);
            return res.status(400).json({
                message: 'Invalid URL parameters',
                errors: validationError.errors
            })
        }
        const bodyValidation = updateProductSchema.safeParse(req.body);
        if(!bodyValidation.success){
            const validationError = fromZodError(bodyValidation.error);
            return res.status(400).json({
                message: 'Invalid request body',
                errors: validationError.errors
            })
        }
        const { id } = paramsValidation.data;
        const {name,price,quantity,image} = bodyValidation.data;
        const result = await pool.query('UPDATE products SET name = COALESCE($1, name), price = COALESCE($2, price), quantity = COALESCE($3, quantity), image = COALESCE($4, image), updated_at = NOW() WHERE id = $5 RETURNING *',
            [name ?? null, price ?? null, quantity ?? null, image ?? null, id]); // coaslesce is used cause if only price is updated other fields should remain same
        if(result.rowCount === 0){
            return res.status(404).json({message:"product Not Found"});
        }   
        res.status(200).json(result.rows[0]);
    }catch (error){
        res.status(500).json({message: 'Server Error'});
    }
}


export {getProducts, getProduct, createProduct, deleteProduct, updateProduct};