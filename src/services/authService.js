const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../config/database');

const register = async (email, password) => {
    const existingUser = await knex('users').where({ email }).first();
    if (existingUser) throw new Error('User exists');

    const hash = await bcrypt.hash(password, 10);
    return knex('users').insert({ email, password_hash: hash });
};

const login = async (email, password) => {
    const user = await knex('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new Error('Invalid credentials');
    }

    return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { register, login };