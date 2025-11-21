import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Routes
import authRoutes from './routes/auth.routes';
import memoryRoutes from './routes/memories.routes';
import companionRoutes from './routes/companions.routes';
import chronicleRoutes from './routes/chronicles.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/users.routes';

app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/companions', companionRoutes);
app.use('/api/chronicles', chronicleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Travel Journal API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export { prisma };
