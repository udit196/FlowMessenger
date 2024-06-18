const passport = require('passport');  
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/Users');

passport.serializeUser((user, done) => {
    done(null, user.id);
});
  
passport.deserializeUser((id, done) => {
    const user = User.findById(id);
    done(null, user);
});
  
// Using Local Strategy for authentication
passport.use(new LocalStrategy(
    async (username, password, done) => {
        const user = await User.findOne({ username: username });
        if (!user) { return done(null, false); }
        if (user.password != password) { return done(null, false); }
        return done(null, user);
    })
);

module.exports = passport;