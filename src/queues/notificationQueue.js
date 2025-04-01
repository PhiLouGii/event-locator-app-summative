import { Queue } from 'bullmq';

const notificationQueue = new Queue('notifications', {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

export default notificationQueue;
