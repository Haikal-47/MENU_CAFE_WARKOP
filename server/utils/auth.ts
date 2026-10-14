import { SignJWT, jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'warkop_editorial_session_secret_key_987654321_ultra_safe'
);

export interface AdminPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
}

export async function createSessionToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AdminPayload;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.warkop_session || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    return;
  }

  const user = await verifySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Sesi telah kedaluwarsa atau tidak valid. Silakan login kembali.' });
    return;
  }

  req.user = user;
  next();
}
