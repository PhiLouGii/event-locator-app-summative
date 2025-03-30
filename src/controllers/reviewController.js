const knex = require('../config/database');

// Add review
exports.addReview = async (req, res) => {
    const trx = await knex.transaction();
    try {
      const { rating, comment } = req.body;
      const eventId = req.params.id;
      const userId = req.user.id;
  
      console.log('Request data:', { eventId, userId, rating, comment }); // 👈 Log input
  
      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        console.log('Invalid rating:', rating); // 👈 Log validation failure
        return res.status(400).json({ error: 'Rating must be between 1-5' });
      }
  
      // Check for existing review
      const existingReview = await trx('reviews')
        .where({ event_id: eventId, user_id: userId })
        .first();
  
      if (existingReview) {
        console.log('Duplicate review:', existingReview); // 👈 Log duplicate
        return res.status(400).json({ error: 'You already reviewed this event' });
      }
  
      // Insert review
      const [newReview] = await trx('reviews')
        .insert({
          event_id: eventId,
          user_id: userId,
          rating,
          comment
        })
        .returning('*');
  
      console.log('New review:', newReview); // 👈 Log success
      await trx.commit();
      res.status(201).json(newReview);
    } catch (error) {
      console.error('Failed to add review:', error); // 👈 Log detailed error
      await trx.rollback();
      res.status(500).json({ error: 'Failed to add review', details: error.message });
    }
  };

// Get event reviews
exports.getEventReviews = async (req, res) => {
  try {
    const eventId = req.params.id;

    // 1. Validate eventId is a number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // 2. Fetch reviews with user details
    const reviews = await knex('reviews')
      .where('event_id', eventId)
      .join('users', 'reviews.user_id', 'users.id')
      .select(
        'reviews.id',
        'reviews.rating',
        'reviews.comment',
        'reviews.created_at',
        'users.email as user_email'
      );

    // 3. Handle empty results
    if (reviews.length === 0) {
      return res.status(404).json({ error: "No reviews found." });
    }

    res.status(200).json(reviews);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message); // 🚨 Log the error
    res.status(500).json({ error: "Failed to fetch reviews. Check server logs." });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.reviewId;
    const userId = req.user.id;

    // Validate ownership
    const review = await trx('reviews')
      .where({ id: reviewId, user_id: userId })
      .first();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review
    const [updatedReview] = await trx('reviews')
      .where({ id: reviewId })
      .update({ rating, comment })
      .returning('*');

    await trx.commit();
    res.json(updatedReview);
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;

    const deleted = await trx('reviews')
      .where({ id: reviewId, user_id: userId })
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await trx.commit();
    res.status(204).end();
  } catch (error) {
    await trx.rollback();
    res.status(500).json({ error: 'Failed to delete review' });
  }
};