import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes/router.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:8080')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, origin);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());

app.use('/api', router);

connectDB();


const PORT = process.env.PORT || 5000;
app.listen(PORT,  () => {
    console.log(`Server is running on port ${PORT}`);
})
