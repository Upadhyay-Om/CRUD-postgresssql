import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import router from './routes/product.routes.js';

dotenv.config();
const app = express();

//Postegress SQL 

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})
// Connect to Postgres SQL
pool.connect()
.then(() => {
    console.log("Connected to PostgresSQL database");
})
.catch((err) => {
    console.error("Error connecting to PostgresSQL database", err);
})

//Middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}));
// app.use(cors());

//routes
app.use("/api/products", router);

app.get('/',(req,res) => {
    res.send('Server is running');
})
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
