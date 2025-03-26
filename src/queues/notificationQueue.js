const Queue = require('bull');
const redisConfig = { redis: { url: process.env.REDIS_URL } };
const notificationQueue = new Queue('notifications', 'redis://localhost:6379');

notificationQueue.process(async (job) => {
  const { eventId } = job.data;
  // Logic to find users to notify and send notifications
});

module.exports = notificationQueue;