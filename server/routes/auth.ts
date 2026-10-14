import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, adminUsers } from '../db';
import { eq } from 'drizzle-orm';
import { createSessionToken, requireAuth, type AuthenticatedRequest } from '../utils/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

router.post('/login', async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0].message });
      return;
    }

    const { username, password } = parseResult.data;

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username.trim().toLowerCase()))
      .limit(1);

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Username atau password tidak cocok.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Username atau password tidak cocok.' });
      return;
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('warkop_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      token, // Also return token for clients that prefer Authorization header
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses login.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('warkop_session', { path: '/' });
  res.json({ success: true, message: 'Berhasil keluar.' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;
