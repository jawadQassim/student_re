import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import gradeRoutes from './routes/grades.js';
import projectRoutes from './routes/projects.js';
import scheduleRoutes from './routes/schedule.js';
import userRoutes from './routes/users.js';
import prisma from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number.parseInt(process.env.PORT ?? '4000', 10);

app.use(
  cors({
    origin: true,
  }),
);
app.use(express.json());

app.get('/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/projects', projectRoutes);

app.use(express.static(path.join(process.cwd(), '..', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), '..', 'dist', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});