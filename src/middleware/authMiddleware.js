const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const knex = require('../config/database');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    const user = await knex('users')
      .where({ id: jwtPayload.sub })
      .first();
    return user ? done(null, user) : done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Middleware function
const authenticate = passport.authenticate('jwt', { session: false });

module.exports = authenticate;