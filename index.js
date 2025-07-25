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
import checkoutRoute from './route/checkoutRoute.js'
import electronicRoutes from './route/electonicRoute.js'
import projectRoute from './route/projectRoute.js'
// import nodeCron from './utils/node-cron.js'



dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
DB_CONNECT();

// nodeCron()
const corsOpt = {
    origin: process.env.CLIENT_URL,
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
app.use('/api/v1', checkoutRoute)
app.use('/api/v1', electronicRoutes)
app.use('/api/v1', projectRoute)


app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


