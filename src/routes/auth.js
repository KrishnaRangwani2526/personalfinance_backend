const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// User signup
router.post('/signup', async (req, res) => {
  try {
    const { phoneNumber, password, name } = req.body;
    
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password required' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this phone number' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        name: name || `User ${phoneNumber.slice(-4)}`,
        isAdmin: false
      }
    });
    
    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password required' });
    }
    
    // Check if admin
    if (phoneNumber === process.env.ADMIN_PHONE) {
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      
      let admin = await prisma.user.findUnique({
        where: { phoneNumber }
      });
      
      if (!admin) {
        admin = await prisma.user.create({
          data: {
            phoneNumber,
            name: 'Admin',
            isAdmin: true
          }
        });
      }
      
      const token = jwt.sign(
        { id: admin.id, phoneNumber: admin.phoneNumber, isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return res.json({
        token,
        user: {
          id: admin.id,
          phoneNumber: admin.phoneNumber,
          name: admin.name,
          isAdmin: admin.isAdmin
        }
      });
    }
    
    // Regular user login
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please sign up first.' });
    }
    
    // For now, we'll skip password verification for existing users
    // In production, you'd want to migrate existing users to have passwords
    
    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        accounts: true,
        cards: true,
        transactions: { take: 10, orderBy: { createdAt: 'desc' } },
        emis: true
      }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
