import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get companions for a user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const companions = await prisma.companion.findMany({
            where: { userId }
        });
        res.json(companions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch companions' });
    }
});

// Add companion
router.post('/', async (req, res) => {
    const { userId, name, generalRelationship, notes, contact } = req.body;
    try {
        const companion = await prisma.companion.create({
            data: {
                userId,
                name,
                generalRelationship,
                notes,
                contact
            }
        });
        res.json(companion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add companion' });
    }
});

export default router;
