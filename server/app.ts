import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth.ts';
import menuRouter from './routes/menu.ts';
import ordersRouter from './routes/orders.ts';
import adminRouter from './routes/admin.ts';

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'warkop-qr-menu-api', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

export default app;
