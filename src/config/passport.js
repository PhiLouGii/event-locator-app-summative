const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const knex = require('./database');

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  };

  passport.use(new JwtStrategy(opts, async (jwtPayload, done) => {
    try {
      console.log('JWT Payload:', jwtPayload); // Log the decoded token
      const user = await knex('users').where({ id: jwtPayload.sub }).first();
      return user ? done(null, user) : done(null, false);
    } catch (err) {
      console.error('JWT Error:', err); // Log errors
      return done(err, false);
    }
  }));
};