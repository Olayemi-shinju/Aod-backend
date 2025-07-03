import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { DB_CONNECT } from './db_connect.js'; // Add `.js` extension for ES Modules
import userRoute from './route/userRoute.js'
import categoryRoute from './route/categoryRoute.js'
import productRoute from './route/productRoute.js'
import reviewRoute from './route/reviewRoute.js'
import contactRoute from './route/contactRoute.js'
import wishlistRoute from './route/wishlistRoute.js'
import cartRoute from './route/cartRoute.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(cookieParser());
DB_CONNECT();

const corsOpt = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
};

app.use(cors(corsOpt));
app.use('/api/v1', userRoute)
app.use('/api/v1', categoryRoute)
app.use('/api/v1', productRoute)
app.use('/api/v1', reviewRoute)
app.use('/api/v1', contactRoute)
app.use('/api/v1', wishlistRoute)
app.use('/api/v1', cartRoute)

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
