const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin only - handled in admin route)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            accounts: true,
            cards: true,
            transactions: true,
            emis: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user details
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own data, admins can see all
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          include: {
            anchors: true,
            transactions: true
          }
        },
        cards: {
          include: {
            cycles: true,
            transactions: true
          }
        },
        transactions: {
          include: {
            category: true
          },
          orderBy: { createdAt: 'desc' }
        },
        emis: true,
        templates: true,
        recurring: true,
        categories: true
      }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user profile
router.put('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;
    
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      include: {
        accounts: true,
        cards: true
      }
    });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(userId).emit('data-update', {
      type: 'user-update',
      payload: user
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
