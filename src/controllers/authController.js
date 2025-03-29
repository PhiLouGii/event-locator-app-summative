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
  
      // Find user
      const user = await knex('users').where({ email }).first();
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Check passwordrs
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Generate JWT
      const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
        expiresIn: '2h'
      });
  
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Login failed' });
    }
}