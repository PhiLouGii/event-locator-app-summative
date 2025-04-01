async function findEventsWithinRadius(userLat, userLng, radius) {
    return knex.raw(`
      SELECT *, 
        ST_Distance(
          location::geography, 
          ST_MakePoint(:userLng, :userLat)::geography
        ) AS distance
      FROM events
      WHERE ST_DWithin(
        location::geography,
        ST_MakePoint(:userLng, :userLat)::geography,
        :radius
      )
      ORDER BY distance
    `, { userLat, userLng, radius });
  }

async function scheduleEventReminders(eventId) {
    const event = await getEventById(eventId);
    const reminderTime = event.startTime - (24 * 60 * 60 * 1000); // 24hrs before
    
    await notificationQueue.add('event_reminder', {
      eventId: event.id,
      type: 'event_reminder'
    }, {
      delay: Date.now() - reminderTime
    });
  }
  
  