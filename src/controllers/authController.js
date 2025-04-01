const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../config/database');

// User registration
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const existingUser = await knex('users').where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists'});
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const [newUser] = await knex('users')
          .insert({
            email,
            password_hash: hashedPassword
          })
          .returning('id');

        res.status(201).json({ id: newUser.id, email });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Registration failed' });
        }
    };

    // User login
    exports.login = async (req, res) => {
      try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email); // 👈 Debug log
    
        // Find user
        const user = await knex('users').where({ email }).first();
        if (!user) {
          console.log('User not found'); // 👈 Debug log
          return res.status(401).json({ error: 'Invalid credentials' });
        }
    
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid?', validPassword); // 👈 Debug log
    
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
    
        // Generate JWT
        if (!process.env.JWT_SECRET) { // 👈 Validate secret exists
          console.error('JWT_SECRET is undefined!');
          return res.status(500).json({ error: 'Server error' });
        }
    
        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
          expiresIn: '24h'
        });
    
        console.log('Token generated successfully'); // 👈 Debug log
        res.json({ token });
    
      } catch (error) {
        res.status(400).json({ 
          error: req.t('error.invalidCredentials') // 👈 Translated error
        });
      }
    };