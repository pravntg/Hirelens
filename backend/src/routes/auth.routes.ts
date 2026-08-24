import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { UserModel } from '../models/user.model.js';

export const authRouter = Router();

// Helper to hash passwords using crypto pbkdf2
function hashPassword(password: string): string {
  const salt = 'smart_resume_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// POST /api/auth/signup - Register new account with Username & Password
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      res.status(400).json({ error: 'Username, email, password, and full name are required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const existingUsername = await UserModel.findOne({ username: cleanUsername });
    if (existingUsername) {
      res.status(400).json({ error: 'Username is already taken. Please choose another.' });
      return;
    }

    const existingEmail = await UserModel.findOne({ email: cleanEmail });
    if (existingEmail) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const hashedPassword = hashPassword(password);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`;

    const newUser = new UserModel({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      name: name.trim(),
      avatar
    });

    await newUser.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar
      }
    });
  } catch (err: any) {
    console.error('Sign up error:', err);
    res.status(500).json({ error: err.message || 'Failed to create account.' });
  }
});

// POST /api/auth/login - Sign In with Username or Email & Password
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ error: 'Please enter your username/email and password.' });
      return;
    }

    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();
    const user = await UserModel.findOne({
      $or: [{ username: cleanIdentifier }, { email: cleanIdentifier }]
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    res.json({
      message: 'Sign in successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (err: any) {
    console.error('Sign in error:', err);
    res.status(500).json({ error: err.message || 'Authentication error.' });
  }
});
