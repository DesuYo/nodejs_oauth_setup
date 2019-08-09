const { Router } = require('express')

const { genAuthorizeMiddleware, genCallbackMiddleware } = require('../services/oauth.service')

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = process.env

module.exports = Router()

.get('/google', genAuthorizeMiddleware('google', GOOGLE_CLIENT_ID))

.get('/discord', genAuthorizeMiddleware('discord', DISCORD_CLIENT_ID))

.get('/google/cb', genCallbackMiddleware('google', GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET))

.get('/discord/cb', genCallbackMiddleware('discord', DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET))

