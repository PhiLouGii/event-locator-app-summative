const validateEventLocation = (req, res, next) => {
    const { lng, lat } = req.body.location;
    
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    next();
  };