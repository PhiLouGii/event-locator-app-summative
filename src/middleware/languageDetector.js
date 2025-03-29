const { LanguageDetector } = require('i18next-http-middleware');

class CustomLanguageDetector extends LanguageDetector {
  constructor(options) {
    super(options);
    this.name = 'userLanguage';
  }

  detect(req, res) {
    // Safety check for undefined req
    if (!req) return this.fallbackLng;
    
    // 1. Check authenticated user first
    if (req.user?.preferred_language) {
      return req.user.preferred_language;
    }
    
    // 2. Fallback to default detection
    return super.detect(req, res) || this.fallbackLng;
  }
}

module.exports = CustomLanguageDetector;