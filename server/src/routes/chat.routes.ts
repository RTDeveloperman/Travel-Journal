import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get chat history between two users
router.get('/history/:userId1/:userId2', async (req, res) => {
    const { userId1, userId2 } = req.params;
    try {
        const messages = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 }
                ]
            },
            orderBy: { timestamp: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Get list of conversations for a user
router.get('/conversations/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Find all messages where the user is sender or receiver
        const messages = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { timestamp: 'desc' },
            include: {
                sender: {
                    select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
                },
                receiver: {
                    select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true }
                }
            }
        });

        // Group by conversation partner
        const conversationsMap = new Map();

        messages.forEach(msg => {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;

            if (!conversationsMap.has(partnerId)) {
                const partner = msg.senderId === userId ? msg.receiver : msg.sender;
                conversationsMap.set(partnerId, {
                    id: [userId, partnerId].sort().join('_'),
                    participants: [userId, partnerId],
                    lastMessageText: msg.text || (msg.type === 'image' ? '📷 تصویر' : 'پیام'),
                    lastMessageType: msg.type,
                    lastMessageTimestamp: msg.timestamp,
                    lastMessageSenderId: msg.senderId,
                    unreadCounts: { [userId]: 0, [partnerId]: 0 } // Placeholder, real count needs more logic
                });
            }
        });

        const conversations = Array.from(conversationsMap.values());
        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Send message
router.post('/', async (req, res) => {
    const { senderId, receiverId, type, text, fileUrl, fileName, fileType, fileSize, linkedItemId, linkedItemTitle, originalMessageId, originalMessageText, originalMessageSenderId, forwardedFromUserId } = req.body;
    try {
        const message = await prisma.chatMessage.create({
            data: {
                senderId,
                receiverId,
                type,
                text,
                fileUrl,
                fileName,
                fileType,
                fileSize,
                linkedItemId,
                linkedItemTitle,
                originalMessageId,
                originalMessageText,
                originalMessageSenderId,
                forwardedFromUserId
            }
        });
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark messages as read
router.post('/read', async (req, res) => {
    const { senderId, receiverId } = req.body;
    try {
        await prisma.chatMessage.updateMany({
            where: {
                senderId: senderId,
                receiverId: receiverId,
                isRead: false
            },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

export default router;
