import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get memories for a user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const memories = await prisma.memory.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId } } }
                ]
            },
            include: {
                images: true,
                companions: {
                    include: {
                        companion: true
                    }
                },
                sharedWith: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform for frontend
        const transformed = memories.map(m => ({
            ...m,
            companions: m.companions.map(mc => ({
                companionId: mc.companionId,
                roleInTrip: mc.roleInTrip,
                // We might need to fetch companion details if the frontend expects full objects in a different way,
                // but the type definition uses MemoryCompanionLink which just has IDs usually, 
                // let's check types.ts. 
                // types.ts: companions?: MemoryCompanionLink[]; 
                // MemoryCompanionLink: { companionId: string; roleInTrip?: string; }
            })),
            sharedWith: m.sharedWith.map(sw => ({
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
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
});

// Create memory
router.post('/', async (req, res) => {
    const { userId, locationName, title, description, eventDate, images, companions, includeInEventsTour, showInExplore, geminiPondering, latitude, longitude } = req.body;
    try {
        const memory = await prisma.memory.create({
            data: {
                userId,
                locationName,
                title,
                description,
                eventDate: new Date(eventDate),
                geminiPondering,
                latitude,
                longitude,
                includeInEventsTour,
                showInExplore,
                images: {
                    create: images.map((img: any) => ({
                        name: img.name,
                        type: img.type,
                        dataUrl: img.dataUrl
                    }))
                },
                companions: {
                    create: companions.map((comp: any) => ({
                        companion: { connect: { id: comp.companionId } },
                        roleInTrip: comp.roleInTrip
                    }))
                }
            },
            include: {
                images: true,
                companions: true,
                sharedWith: true
            }
        });
        res.json(memory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create memory' });
    }
});

// Update memory
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { locationName, title, description, eventDate, images, companions, includeInEventsTour, showInExplore, latitude, longitude } = req.body;

    try {
        // First delete existing relations that are being replaced (simple approach)
        // For images, we might want to be smarter, but for now let's replace.
        // Actually, Prisma update is tricky with lists. 
        // Let's just update basic fields and handle relations carefully.

        // Delete old images
        await prisma.image.deleteMany({ where: { memoryId: id } });
        // Delete old companion links
        await prisma.memoryCompanion.deleteMany({ where: { memoryId: id } });

        const updatedMemory = await prisma.memory.update({
            where: { id },
            data: {
                locationName,
                title,
                description,
                eventDate: new Date(eventDate),
                latitude,
                longitude,
                includeInEventsTour,
                showInExplore,
                images: {
                    create: images.map((img: any) => ({
                        name: img.name,
                        type: img.type,
                        dataUrl: img.dataUrl
                    }))
                },
                companions: {
                    create: companions.map((comp: any) => ({
                        companion: { connect: { id: comp.companionId } },
                        roleInTrip: comp.roleInTrip
                    }))
                }
            },
            include: {
                images: true,
                companions: true,
                sharedWith: { include: { user: true } }
            }
        });

        // Transform sharedWith for frontend
        const result = {
            ...updatedMemory,
            companions: updatedMemory.companions.map(mc => ({
                companionId: mc.companionId,
                roleInTrip: mc.roleInTrip
            })),
            sharedWith: updatedMemory.sharedWith.map(sw => ({
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
        console.error(error);
        res.status(500).json({ error: 'Failed to update memory' });
    }
});

// Delete memory
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.memory.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete memory' });
    }
});

// Share memory
router.post('/:id/share', async (req, res) => {
    const { id } = req.params;
    const { targetUserId } = req.body;
    try {
        await prisma.sharedMemory.create({
            data: {
                memoryId: id,
                userId: targetUserId
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to share memory' });
    }
});

export default router;
