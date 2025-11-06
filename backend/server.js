import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/router.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

app.use(cors());

app.use('/api', router);

connectDB();


const PORT = process.env.PORT || 5000;
app.listen(PORT,  () => {
    console.log(`Server is running on port ${PORT}`);
})