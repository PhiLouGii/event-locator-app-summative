// Coordinate validation
exports.validateCoordinates = (lat, lng) => {
    if (isNaN(lat) || lat < -90 || lat > 90 ||
        isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates');
    }
  };
  
  // Language validation
  exports.validateLanguage = (language) => {
    const validLanguages = ['en', 'es', 'fr', 'it'];
    if (!validLanguages.includes(language)) {
      throw new Error('Invalid language selection');
    }
  };