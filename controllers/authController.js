const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
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

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      tierId: 'silver' // newly registered user starts at silver
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id, user.role);

      res.cookie('access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('access_token');
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};