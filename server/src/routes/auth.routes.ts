import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // For simplicity, we're not hashing passwords in this demo, but in production you MUST.
        let user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            // Auto-register for demo purposes if user doesn't exist
            user = await prisma.user.create({
                data: {
                    username,
                    password, // In real app, hash this!
                    handle: `@${username}`,
                    firstName: username,
                    role: 'user'
                }
            });
        } else if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register (for admin or explicit registration)
router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, dateOfBirth, country, gender, searchableByName, bio } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await prisma.user.create({
            data: {
                username,
                password: password || '123456', // Default password if not provided
                handle: `@${username}`,
                firstName,
                lastName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                country,
                gender,
                searchableByName,
                bio,
                role: 'user'
            }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get all users (public list) - Updated to include counts for admin
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                handle: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
                role: true,
                bio: true,
                isBanned: true,
                _count: {
                    select: {
                        memories: true,
                        chronicleEvents: true,
                        sharedMemories: true
                    }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Reset user password
router.post('/admin/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    try {
        // In a real app, you should hash this password!
        // For this demo, we are storing plain text or simple hash if implemented.
        // Assuming plain text based on previous context, but ideally should be hashed.
        // const hashedPassword = await bcrypt.hash(newPassword, 10); 

        await prisma.user.update({
            where: { id },
            data: { password: newPassword },
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Admin: Ban/Unban user
router.post('/admin/users/:id/ban', async (req, res) => {
    const { id } = req.params;
    const { isBanned } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { isBanned },
        });
        res.json(user);
    } catch (error) {
        console.error('Error updating ban status:', error);
        res.status(500).json({ error: 'Failed to update ban status' });
    }
});

export default router;
