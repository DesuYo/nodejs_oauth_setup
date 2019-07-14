const got = require('got')

const { getDB } = require('../db')

exports.initOauthServer = (req, _, next) => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = process.env
    req.oauthProviders = {
        google: {
            authorizeURI: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenURI: 'https://www.googleapis.com/oauth2/v4/token',
            profileURI: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            fields: { id: 'id', email: 'email', username: 'name', avatar: 'picture' }
        },
        discord: {
            authorizeURI: 'https://discordapp.com/api/oauth2/authorize',
            tokenURI: 'https://discordapp.com/api/oauth2/token',
            profileURI: 'https://discordapp.com/api/users/@me',
            clientID: DISCORD_CLIENT_ID,
            clientSecret: DISCORD_CLIENT_SECRET,
            scope: 'identify email',
            fields: { id: 'id', email: 'email', username: 'username', avatar: 'avatar' }
        }
    }
    next()
}

exports.genAuthorizeMiddleware = (provider) => 
({ oauthProviders: { [provider]: { authorizeURI, clientID, scope } }, 
    protocol, headers: { host }, baseUrl, path }, res) => {
    //const { authorizeURI, clientID, scope } = oauthProviders[provider]
    res.redirect(
        authorizeURI +
        `?client_id=${clientID}` + 
        `&redirect_uri=${protocol}://${host}${baseUrl}${path}/cb` +
        `&response_type=code` +
        `&scope=${scope}`
    )
}

exports.genCallbackMiddleware = (provider) => 
async ({ oauthProviders: { [provider]: { tokenURI, profileURI, clientID, clientSecret, fields } }, 
    query: { code }, protocol, headers: { host }, baseUrl, path }, res) => {
    //const { tokenURI, profileURI, clientID, clientSecret } = oauthProviders[provider]
    got
    .post(tokenURI, {
        form: true,
        json: true,
        body: {
            code,
            client_id: clientID,
            client_secret: clientSecret,
            redirect_uri: `${protocol}://${host}${baseUrl}${path}`,
            grant_type: 'authorization_code'
        }
    })
    .then(({ body: { access_token } }) => got.get(profileURI, {
        headers: { authorization: `Bearer ${access_token}` },
        json: true
    }))
    .then(({ body: { [fields.id]: id, [fields.email]: email, [fields.username]: username, [fields.avatar]: avatar, verified_email, ...rest } }) => {
        if (provider === 'google' && !verified_email) throw new Error('Email is not verified')
        console.log({ id, email, username, avatar, verified_email, ...rest })
        return getDB().collection('users')
            .updateOne(
                { $or: [{ [`${provider}ID`]: id }, { email: { $type: 'string', $ne: '', $eq: email } }] }, 
                { $set: { [`${provider}ID`]: id, email, username, avatar } }, 
                { upsert: true }
            )
    })       
    .then(() => res.redirect('/'))
    .catch(error => {
        console.log(error)
        res.end()
    })
}