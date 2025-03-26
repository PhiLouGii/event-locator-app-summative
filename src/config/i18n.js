const i18next = require('i18next');
const middleware = require('i18next-http-middleware');

i18next.use(middleware.LanguageDetector).init({
  fallbackLng: 'en',
  resources: {
    en: { translation: require('../translations/en.json') },
    es: { translation: require('../translations/es.json') },
  },
});

module.exports = middleware.handle(i18next);