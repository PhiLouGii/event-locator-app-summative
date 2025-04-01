const Queue = require('bull');
const { redisClient } = require('../config/redis');
const { sendPushNotification, sendEmail } = require('../services/notificationService');

// Configure Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

// Create Bull queue instance
const notificationQueue = new Queue('notifications', { redis: redisConfig });

// Process jobs from the queue
notificationQueue.process('*', async (job) => {
  try {
    console.log(`Processing job ${job.id}: ${job.name}`);
    
    switch(job.name) {
      case 'EVENT_REMINDER':
        await handleEventReminder(job.data);
        break;
      case 'NEW_EVENT':
        await handleNewEventNotification(job.data);
        break;
      default:
        console.warn(`Unknown job type: ${job.name}`);
    }
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
});

// Redis pub/sub for real-time notifications
const initRedisSubscriptions = () => {
  redisClient.subscribe('events', (err) => {
    if (err) console.error('Redis subscribe error:', err);
  });

  redisClient.on('message', (channel, message) => {
    if (channel === 'events') {
      const { type, data } = JSON.parse(message);
      switch(type) {
        case 'NEW_EVENT':
          handleRealTimeEventNotification(data);
          break;
      }
    }
  });
};

// Notification handlers
async function handleEventReminder({ userId, event }) {
  // Implementation example:
  const user = await getUserById(userId);
  await sendEmail({
    to: user.email,
    subject: `Reminder: ${event.title}`,
    text: `Event starts at ${event.date_time}`
  });
}

async function handleNewEventNotification({ event, recipients }) {
  // Batch send notifications
  await sendPushNotification(recipients, {
    title: 'New Event',
    body: event.title
  });
}

function handleRealTimeEventNotification(event) {
  // Immediate WebSocket/Push notifications
  notifySubscribedUsers(event);
}

// Helper functions
async function getUserById(userId) {
  return knex('users').where({ id: userId }).first();
}

async function notifySubscribedUsers(event) {
  const subscribers = await knex('user_subscriptions')
    .whereIn('category_id', event.category_ids)
    .pluck('user_id');
  
  if (subscribers.length > 0) {
    await handleNewEventNotification({
      event,
      recipients: subscribers
    });
  }
}

// Initialize worker
initRedisSubscriptions();
console.log('Notification worker started and listening...');