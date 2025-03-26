require('dotenv').config();

module.exports = {
    development: {
       client: 'pg',
       connection: process.env.DATABASE_URL,
       migrations: {
        directory: './migrations',
       },
       seeds: {
        directory: './seeds',
       } 
    },
    test: {
        client: 'pg',
        connection: process.env.TEST_DATABASE_URL,
        migrations: {
            directory: './migrations',
        }
    }
};