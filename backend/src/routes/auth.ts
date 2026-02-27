import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'snake-pos-secret-key';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่ (15 นาที)' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const prisma = (req as any).prisma;

  if (!email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'ไม่มี token' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const prisma = (req as any).prisma;
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    return res.json(user);
  } catch {
    return res.status(401).json({ error: 'token ไม่ถูกต้อง' });
  }
});

export default router;
