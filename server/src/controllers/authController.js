const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        // Check if user exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR phone = ?',
            [email, phone]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email or phone' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Default role validation
        const userRole = ['citizen', 'staff', 'admin'].includes(role) ? role : 'citizen';

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, userRole]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        // Check if user exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR phone = ?',
            [email, phone]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email or phone' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const validRoles = ['citizen', 'staff', 'admin'];
        const userRole = validRoles.includes(role) ? role : 'citizen';

        const [result] = await pool.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, userRole]
        );

        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, getUsers, createUser };
