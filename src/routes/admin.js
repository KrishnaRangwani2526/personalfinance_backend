const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users with their data summary
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            accounts: true,
            cards: true,
            transactions: true,
            emis: true
          }
        },
        accounts: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        cards: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            emis: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { category: true }
        },
        emis: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user's complete data
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          include: {
            anchors: true,
            transactions: {
              include: { category: true },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        cards: {
          include: {
            cycles: true,
            transactions: {
              include: { category: true },
              orderBy: { createdAt: 'desc' }
            },
            emis: true
          }
        },
        transactions: {
          include: { category: true },
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
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update user data (admin can edit any user's data)
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { accounts, cards, transactions, emis, templates, recurring, categories } = req.body;
    
    const io = req.app.get('io');
    
    // Update accounts
    if (accounts) {
      for (const account of accounts) {
        await prisma.bankAccount.upsert({
          where: { id: account.id },
          update: account,
          create: { ...account, userId }
        });
      }
    }
    
    // Update cards
    if (cards) {
      for (const card of cards) {
        await prisma.cardAccount.upsert({
          where: { id: card.id },
          update: card,
          create: { ...card, userId }
        });
      }
    }
    
    // Update transactions
    if (transactions) {
      for (const txn of transactions) {
        await prisma.transaction.upsert({
          where: { id: txn.id },
          update: txn,
          create: { ...txn, userId }
        });
      }
    }
    
    // Update EMIs
    if (emis) {
      for (const emi of emis) {
        await prisma.emi.upsert({
          where: { id: emi.id },
          update: emi,
          create: { ...emi, userId }
        });
      }
    }
    
    // Emit real-time update to the user
    io.to(userId).emit('data-update', {
      type: 'admin-update',
      payload: { accounts, cards, transactions, emis }
    });
    
    res.json({ success: true, message: 'User data updated' });
  } catch (error) {
    console.error('Admin update error:', error);
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      totalEmis,
      totalAccounts,
      totalCards,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.emi.count(),
      prisma.bankAccount.count(),
      prisma.cardAccount.count(),
      prisma.transaction.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              phoneNumber: true,
              name: true
            }
          },
          category: true
        }
      })
    ]);
    
    const totalVolume = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    });
    
    res.json({
      totalUsers,
      totalTransactions,
      totalEmis,
      totalAccounts,
      totalCards,
      totalVolume: totalVolume._sum.amount || 0,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Delete user account (admin only)
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    const io = req.app.get('io');
    io.to(userId).emit('data-update', {
      type: 'account-deleted',
      payload: { userId }
    });
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
