const { Router } = require('express')

const { initOauthServer, genAuthorizeMiddleware, genCallbackMiddleware } = require('../services/oauth.service')

module.exports = Router()

.use('/', initOauthServer)

.get('/google', genAuthorizeMiddleware('google'))

.get('/discord', genAuthorizeMiddleware('discord'))

.get('/google/cb', genCallbackMiddleware('google'))

.get('/discord/cb', genCallbackMiddleware('discord'))

