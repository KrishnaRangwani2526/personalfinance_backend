const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Sync data from client
router.post('/sync', auth, async (req, res) => {
  try {
    const { accounts, cards, transactions, emis, templates, recurring, categories } = req.body;
    const userId = req.user.id;
    
    const io = req.app.get('io');
    
    // Sync accounts
    if (accounts) {
      for (const account of accounts) {
        if (account.id) {
          await prisma.bankAccount.upsert({
            where: { id: account.id },
            update: account,
            create: { ...account, userId }
          });
        } else {
          await prisma.bankAccount.create({
            data: { ...account, userId }
          });
        }
      }
    }
    
    // Sync cards
    if (cards) {
      for (const card of cards) {
        if (card.id) {
          await prisma.cardAccount.upsert({
            where: { id: card.id },
            update: card,
            create: { ...card, userId }
          });
        } else {
          await prisma.cardAccount.create({
            data: { ...card, userId }
          });
        }
      }
    }
    
    // Sync transactions
    if (transactions) {
      for (const txn of transactions) {
        if (txn.id) {
          await prisma.transaction.upsert({
            where: { id: txn.id },
            update: txn,
            create: { ...txn, userId }
          });
        } else {
          await prisma.transaction.create({
            data: { ...txn, userId }
          });
        }
      }
    }
    
    // Sync EMIs
    if (emis) {
      for (const emi of emis) {
        if (emi.id) {
          await prisma.emi.upsert({
            where: { id: emi.id },
            update: emi,
            create: { ...emi, userId }
          });
        } else {
          await prisma.emi.create({
            data: { ...emi, userId }
          });
        }
      }
    }
    
    // Sync templates
    if (templates) {
      for (const template of templates) {
        if (template.id) {
          await prisma.quickEntryTemplate.upsert({
            where: { id: template.id },
            update: template,
            create: { ...template, userId }
          });
        } else {
          await prisma.quickEntryTemplate.create({
            data: { ...template, userId }
          });
        }
      }
    }
    
    // Sync recurring
    if (recurring) {
      for (const rec of recurring) {
        if (rec.id) {
          await prisma.recurringTransaction.upsert({
            where: { id: rec.id },
            update: rec,
            create: { ...rec, userId }
          });
        } else {
          await prisma.recurringTransaction.create({
            data: { ...rec, userId }
          });
        }
      }
    }
    
    // Sync categories
    if (categories) {
      for (const cat of categories) {
        if (cat.id) {
          await prisma.category.upsert({
            where: { id: cat.id },
            update: cat,
            create: { ...cat, userId }
          });
        } else {
          await prisma.category.create({
            data: { ...cat, userId }
          });
        }
      }
    }
    
    // Emit real-time update to admin
    io.emit('admin-update', {
      userId,
      type: 'data-sync',
      payload: { accounts, cards, transactions, emis }
    });
    
    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get user data for sync
router.get('/sync', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [accounts, cards, transactions, emis, templates, recurring, categories] = await Promise.all([
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.cardAccount.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.emi.findMany({ where: { userId } }),
      prisma.quickEntryTemplate.findMany({ where: { userId } }),
      prisma.recurringTransaction.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } })
    ]);
    
    res.json({
      accounts,
      cards,
      transactions,
      emis,
      templates,
      recurring,
      categories
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Create transaction
router.post('/transactions', auth, async (req, res) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...req.body,
        userId: req.user.id
      },
      include: { category: true }
    });
    
    const io = req.app.get('io');
    io.to(req.user.id).emit('data-update', {
      type: 'transaction-created',
      payload: transaction
    });
    io.emit('admin-update', {
      userId: req.user.id,
      type: 'transaction-created',
      payload: transaction
    });
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true }
    });
    
    const io = req.app.get('io');
    io.to(req.user.id).emit('data-update', {
      type: 'transaction-updated',
      payload: transaction
    });
    io.emit('admin-update', {
      userId: req.user.id,
      type: 'transaction-updated',
      payload: transaction
    });
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/transactions/:id', auth, async (req, res) => {
  try {
    await prisma.transaction.delete({
      where: { id: req.params.id }
    });
    
    const io = req.app.get('io');
    io.to(req.user.id).emit('data-update', {
      type: 'transaction-deleted',
      payload: { id: req.params.id }
    });
    io.emit('admin-update', {
      userId: req.user.id,
      type: 'transaction-deleted',
      payload: { id: req.params.id }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
