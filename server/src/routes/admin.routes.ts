import express from 'express';
import { prisma } from '../index';

const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            totalMemories,
            totalChronicleEvents,
            totalSharedMemories,
            totalSharedChronicleEvents,
            users
        ] = await Promise.all([
            prisma.user.count(),
            prisma.memory.count(),
            prisma.chronicleEvent.count(),
            prisma.sharedMemory.count(),
            prisma.sharedChronicle.count(),
            prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    handle: true,
                    avatarUrl: true,
                    firstName: true,
                    lastName: true,
                    _count: {
                        select: {
                            sharedMemories: true,
                            sharedChronicles: true, // Note: This is 'received' shares if using the relation on User model
                            // To get 'sent' shares, we need to look at the memory/chronicle side or add relation
                            // Let's approximate activity by received shares for now or refine if needed.
                            // Wait, the schema has:
                            // sharedMemories SharedMemory[] (User who it is shared WITH)
                            // So user.sharedMemories is RECEIVED.
                            // To get SENT, we need to count SharedMemory where memory.userId == user.id
                            // This is complex in a single count query.
                        }
                    }
                }
            })
        ]);

        // Calculate derived stats
        const totalItems = totalMemories + totalChronicleEvents;
        const averageItemsPerUser = totalUsers > 0 ? totalItems / totalUsers : 0;

        const percentageSharedMemories = totalMemories > 0 ? (totalSharedMemories / totalMemories) * 100 : 0;
        const percentageSharedChronicleEvents = totalChronicleEvents > 0 ? (totalSharedChronicleEvents / totalChronicleEvents) * 100 : 0;

        // Calculate User Activity Stats
        // For "Most Active Sharer", we need to query differently or do it in JS.
        // Doing it in JS for now as dataset is likely small for this demo.
        // Ideally, use raw SQL or aggregate queries.

        // Let's fetch share counts (sent)
        const shareCounts = await prisma.sharedMemory.groupBy({
            by: ['memoryId'],
            _count: {
                id: true
            },
            // We need the owner of the memory. 
            // groupBy doesn't support relations.
            // We'll have to fetch all shared memories and aggregate in JS.
        });

        // Alternative: Fetch all users with their sent memories that have shares.
        // This is getting heavy. Let's stick to a simpler approximation or just fetch what we need.

        // Let's fetch all SharedMemory with relation to Memory->User
        const allSharedMemories = await prisma.sharedMemory.findMany({
            include: {
                memory: {
                    select: { userId: true }
                }
            }
        });

        const sharerCounts: Record<string, number> = {};
        allSharedMemories.forEach(sm => {
            const ownerId = sm.memory.userId;
            sharerCounts[ownerId] = (sharerCounts[ownerId] || 0) + 1;
        });

        // Find top sharer
        let mostActiveSharerId = null;
        let maxShares = -1;
        for (const [userId, count] of Object.entries(sharerCounts)) {
            if (count > maxShares) {
                maxShares = count;
                mostActiveSharerId = userId;
            }
        }

        const mostActiveSharerUser = mostActiveSharerId ? users.find(u => u.id === mostActiveSharerId) : null;
        const mostActiveSharer = mostActiveSharerUser ? {
            userId: mostActiveSharerUser.id,
            username: mostActiveSharerUser.username,
            handle: mostActiveSharerUser.handle || undefined,
            avatarUrl: mostActiveSharerUser.avatarUrl || undefined,
            firstName: mostActiveSharerUser.firstName || undefined,
            lastName: mostActiveSharerUser.lastName || undefined,
            shareCount: maxShares
        } : undefined;


        // Most Frequent Recipient
        // We already have _count.sharedMemories (received) from the user query
        const sortedByReceived = [...users].sort((a, b) => {
            const countA = (a._count.sharedMemories || 0) + (a._count.sharedChronicles || 0);
            const countB = (b._count.sharedMemories || 0) + (b._count.sharedChronicles || 0);
            return countB - countA;
        });

        const topRecipient = sortedByReceived[0];
        const topRecipientCount = topRecipient ? (topRecipient._count.sharedMemories || 0) + (topRecipient._count.sharedChronicles || 0) : 0;

        const mostFrequentRecipient = topRecipient && topRecipientCount > 0 ? {
            userId: topRecipient.id,
            username: topRecipient.username,
            handle: topRecipient.handle || undefined,
            avatarUrl: topRecipient.avatarUrl || undefined,
            firstName: topRecipient.firstName || undefined,
            lastName: topRecipient.lastName || undefined,
            receiveCount: topRecipientCount
        } : undefined;


        // User Activity Stats for Diagram (Top 5 active users by total items)
        // We need counts of memories and chronicles per user
        const usersWithItemCounts = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                handle: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
                role: true,
                _count: {
                    select: {
                        memories: true,
                        chronicleEvents: true
                    }
                }
            },
            take: 10 // Limit to top 10 candidates to process
            // Ideally order by count, but Prisma sort by relation count is tricky in one go for sum.
            // We'll fetch all (or top 50) and sort in JS if user base is small.
        });

        const userActivityStats = usersWithItemCounts.map(u => ({
            user: {
                id: u.id,
                username: u.username,
                handle: u.handle,
                avatarUrl: u.avatarUrl,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role
            },
            memoriesCreatedCount: u._count.memories,
            chronicleEventsCreatedCount: u._count.chronicleEvents,
            totalItems: u._count.memories + u._count.chronicleEvents,
            sharedItemCount: 0, // Placeholder
            sharedWithUsers: [], // Placeholder
            receivedShareCount: 0 // Placeholder
        }))
            .sort((a, b) => b.totalItems - a.totalItems)
            .slice(0, 5);


        res.json({
            totalUsers,
            totalActiveUsers: totalUsers, // Placeholder, maybe filter by last login if we had it
            totalMemories,
            totalChronicleEvents,
            totalSharedMemories,
            totalSharedChronicleEvents,
            percentageSharedMemories,
            percentageSharedChronicleEvents,
            averageItemsPerUser,
            mostActiveSharer,
            mostFrequentRecipient,
            userActivityStats
        });

    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
});

export default router;
