const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE, authCookieOptions } = require('../lib/authCookie');
const { sendOtpEmail, sendRegistrationOtpEmail } = require('../lib/mail');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// A database that cannot be reached is not the caller's fault, and reporting it
// as a flat 500 "Server error" makes a working login look like bad credentials.
const failWithCause = (res, error, context) => {
  console.error(`${context}:`, error);

  if (error.name === 'PrismaClientInitializationError' || error.code === 'P1001') {
    return res.status(503).json({
      message: 'Cannot reach the database. Check DATABASE_URL and network access.',
      code: 'DB_UNREACHABLE',
    });
  }

  return res.status(500).json({
    message: 'Server error',
    ...(process.env.NODE_ENV === 'production' ? {} : { error: error.message }),
  });
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'AGENCY'
      }
    });

    const token = generateToken(user.id, user.role);

    res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions, maxAge: AUTH_COOKIE_MAX_AGE });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      tierId: 'silver' // newly registered user starts at silver
    });
  } catch (error) {
    failWithCause(res, error, 'Register error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id, user.role);

      res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions, maxAge: AUTH_COOKIE_MAX_AGE });

      // Get user's tierId from application if exists
      let tierId = 'silver';
      if (user.role === 'AGENCY') {
        const app = await prisma.application.findUnique({
          where: { userId: user.id }
        });
        if (app) {
          tierId = app.tierId;
        }
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
        tierId
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    failWithCause(res, error, 'Login error');
  }
};

exports.logout = (req, res) => {
  // Attributes must match the ones used to set it, or the browser keeps the cookie.
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let tierId = 'silver';
    if (user.role === 'AGENCY') {
      const app = await prisma.application.findUnique({
        where: { userId: user.id }
      });
      if (app) {
        tierId = app.tierId;
      }
    }

    res.status(200).json({
      ...user,
      tierId
    });
  } catch (error) {
    failWithCause(res, error, 'getMe error');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide email' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetOtp: otp,
        resetOtpExpires: expires
      }
    });

    // Send actual email via configured SMTP (fails gracefully if not configured)
    await sendOtpEmail(email, otp);

    const responsePayload = { message: 'OTP sent successfully to your email.' };
    res.status(200).json(responsePayload);
  } catch (error) {
    failWithCause(res, error, 'Forgot password error');
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Please provide email, otp, and new password' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetOtp || user.resetOtp !== otp || !user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null
      }
    });

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    failWithCause(res, error, 'Reset password error');
  }
};

exports.sendRegistrationOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Please provide email and otp' });
  }

  try {
    // Send actual email via configured SMTP (fails gracefully if not configured)
    await sendRegistrationOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    failWithCause(res, error, 'Send registration OTP error');
  }
};