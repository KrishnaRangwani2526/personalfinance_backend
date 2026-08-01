const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Hardcoded users - only these two accounts can login
const HARDCODED_USERS = [
  {
    phoneNumber: '9999999999',
    password: 'Admin@123',
    name: 'Admin',
    isAdmin: true
  },
  {
    phoneNumber: '9928452506',
    password: '9928452506',
    name: 'User',
    isAdmin: false
  }
];

// User login (no signup - only hardcoded accounts)
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password required' });
    }
    
    // Find user in hardcoded list
    const hardcodedUser = HARDCODED_USERS.find(
      user => user.phoneNumber === phoneNumber && user.password === password
    );
    
    if (!hardcodedUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create or update user in database
    let user = await prisma.user.findUnique({
      where: { phoneNumber }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          name: hardcodedUser.name,
          isAdmin: hardcodedUser.isAdmin
        }
      });
    } else {
      // Update user data if it has changed
      user = await prisma.user.update({
        where: { phoneNumber },
        data: {
          name: hardcodedUser.name,
          isAdmin: hardcodedUser.isAdmin
        }
      });
    }
    
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
