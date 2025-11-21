import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get chronicle events for a user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const events = await prisma.chronicleEvent.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId } } }
                ]
            },
            include: {
                images: true,
                sharedWith: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { eventDate: 'desc' }
        });

        const transformed = events.map(e => ({
            ...e,
            image: e.images[0] || null, // Frontend expects single image or null
            sharedWith: e.sharedWith.map(sw => ({
                userId: sw.user.id,
                username: sw.user.username,
                handle: sw.user.handle,
                avatarUrl: sw.user.avatarUrl,
                firstName: sw.user.firstName,
                lastName: sw.user.lastName
            }))
        }));

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chronicle events' });
    }
});

// Add chronicle event
router.post('/', async (req, res) => {
    const { userId, title, description, eventDate, image, includeInEventsTour } = req.body;
    try {
        const event = await prisma.chronicleEvent.create({
            data: {
                userId,
                title,
                description,
                eventDate: new Date(eventDate),
                includeInEventsTour,
                images: image ? {
                    create: {
                        name: image.name,
                        type: image.type,
                        dataUrl: image.dataUrl
                    }
                } : undefined
            },
            include: {
                images: true,
                sharedWith: true
            }
        });

        const result = {
            ...event,
            image: event.images[0] || null,
            sharedWith: []
        };
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add chronicle event' });
    }
});

// Update chronicle event
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, eventDate, image, includeInEventsTour } = req.body;

    try {
        // Handle image update: delete old if exists, create new if provided
        if (image) {
            await prisma.image.deleteMany({ where: { chronicleId: id } });
        }

        const updatedEvent = await prisma.chronicleEvent.update({
            where: { id },
            data: {
                title,
                description,
                eventDate: new Date(eventDate),
                includeInEventsTour,
                images: image ? {
                    create: {
                        name: image.name,
                        type: image.type,
                        dataUrl: image.dataUrl
                    }
                } : undefined
            },
            include: {
                images: true,
                sharedWith: { include: { user: true } }
            }
        });

        const result = {
            ...updatedEvent,
            image: updatedEvent.images[0] || null,
            sharedWith: updatedEvent.sharedWith.map(sw => ({
                userId: sw.user.id,
                username: sw.user.username,
                handle: sw.user.handle,
                avatarUrl: sw.user.avatarUrl,
                firstName: sw.user.firstName,
                lastName: sw.user.lastName
            }))
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update chronicle event' });
    }
});

// Delete chronicle event
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.chronicleEvent.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete chronicle event' });
    }
});

// Share chronicle event
router.post('/:id/share', async (req, res) => {
    const { id } = req.params;
    const { targetUserId } = req.body;
    try {
        await prisma.sharedChronicle.create({
            data: {
                chronicleId: id,
                userId: targetUserId
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to share chronicle event' });
    }
});

export default router;
