import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Update user profile
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { handle, avatarUrl, firstName, lastName, searchableByName, country, dateOfBirth, gender, bio } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                handle,
                avatarUrl,
                firstName,
                lastName,
                searchableByName,
                country,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                bio
            }
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});

// Follow user
router.post('/follow', async (req, res) => {
    const { followerId, followingId } = req.body;
    try {
        // Create follow request
        const request = await prisma.followRequest.create({
            data: {
                senderId: followerId,
                receiverId: followingId
            }
        });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send follow request' });
    }
});

// Accept follow request
router.post('/follow/accept', async (req, res) => {
    const { userId, requesterId } = req.body;
    try {
        // Update request status
        await prisma.followRequest.updateMany({
            where: { senderId: requesterId, receiverId: userId, status: 'pending' },
            data: { status: 'accepted' }
        });

        // Create relation
        await prisma.userFollows.create({
            data: {
                followerId: requesterId,
                followingId: userId
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept follow request' });
    }
});

export default router;
