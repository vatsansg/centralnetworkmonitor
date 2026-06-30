'use strict';

const authRouter = require('./auth');
const usersRouter = require('./users');
const venuesRouter = require('./venues');
const favouritesRouter = require('./favourites');

function registerRoutes(app) {
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/venues', venuesRouter);
  app.use('/api/favourites', favouritesRouter);
}

module.exports = { registerRoutes };
