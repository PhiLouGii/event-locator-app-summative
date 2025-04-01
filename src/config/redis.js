const { createClient } = require('redis');
const redisClient = createClient({ url: process.env.REDIS_URL });
const redisPublisher = redisClient.duplicate();

(async () => {
    await redisClient.connect();
    await redisPublisher.connect();
})();

module.exports = { redisClient, redisPublisher };