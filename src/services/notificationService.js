const Queue = require('bull');
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const notificationQueue = new Queue('notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

const publishNotification = async (channel, payload) => {
  await notificationQueue.add(channel, payload);
};

const scheduleNotification = async (userId, event, delay) => {
  await notificationQueue.add(
    'reminders',
    { userId, event },
    { delay }
  );
};


notificationQueue.process('notifications', async (job) => {
  console.log('Processing notification:', job.data);
});

notificationQueue.process('reminders', async (job) => {
  console.log('Processing reminder:', job.data);
});

module.exports = { publishNotification, scheduleNotification };