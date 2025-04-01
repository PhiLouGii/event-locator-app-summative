const generateStaticMapUrl = (events, options = {}) => {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const { size = '600x400', zoom = 12, maptype = 'roadmap' } = options;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
    // Extract markers from events
    const markers = events.map(event => 
      `markers=color:red%7Clabel:E%7C${event.lat},${event.lng}`
    ).join('&');
  
    return `${baseUrl}?size=${size}&zoom=${zoom}&maptype=${maptype}&${markers}&key=${apiKey}`;
  };
  
  module.exports = { generateStaticMapUrl };