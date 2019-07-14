const express = require('express')

const authRoutes = require('./routes/auth.routes')

module.exports = express()
    .use('/oauth', authRoutes)
  