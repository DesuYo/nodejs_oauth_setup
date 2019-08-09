const got = require('got')
const jwt = require('jsonwebtoken')

const { getDB } = require('../db')

const providers = {
    google: {
        authorizeURI: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenURI: 'https://www.googleapis.com/oauth2/v4/token',
        profileURI: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        fields: { id: 'id', email: 'email', username: 'name', photo: 'picture' }
    },
    discord: {
        authorizeURI: 'https://discordapp.com/api/oauth2/authorize',
        tokenURI: 'https://discordapp.com/api/oauth2/token',
        profileURI: 'https://discordapp.com/api/users/@me',
        scope: 'identify email',
        fields: { id: 'id', email: 'email', username: 'username', photo: 'avatar' }
    }
}

exports.genAuthorizeMiddleware = (provider, clientID) => 
({ protocol, headers: { host }, baseUrl, path }, res) => {
    const { authorizeURI, scope } = providers[provider]
    res.redirect(
        authorizeURI +
        `?client_id=${clientID}` + 
        `&redirect_uri=${protocol}://${host}${baseUrl}${path}/cb` +
        `&response_type=code` +
        `&scope=${scope}`
    )
}

exports.genCallbackMiddleware = (provider, clientID, clientSecret) => 
async ({ query: { code }, protocol, headers: { host }, baseUrl, path }, res, next) => {
    try {
        const { tokenURI, profileURI, fields } = providers[provider]
        
        const { body: { access_token } } = await got.post(
            tokenURI, 
            {
                form: true,
                json: true,
                body: {
                    code,
                    client_id: clientID,
                    client_secret: clientSecret,
                    redirect_uri: `${protocol}://${host}${baseUrl}${path}`,
                    grant_type: 'authorization_code'
                }
            }
        )

        const { 
            body: { 
                [fields['id']]: id, 
                [fields['username']]: username, 
                [fields['photo']]: photo, 
                [fields['email']]: email 
            }
        } = await got.get(
            profileURI,
            {
                headers: { authorization: `Bearer ${access_token}` },
                json: true
            }
        )

        let payload = null

        const user = await getDB()
            .collection('users')
            .findOne({ oauth: { provider, id } })

        if (!user) payload = (
            await getDB()
                .collection('users')
                .insertOne({ oauth: { provider, id }, profile: { username, photo, email } })
        ).insertedId.toHexString()
        
        else payload = user._id.toHexString()

        res.json({
            access_token: jwt.sign({ _id: payload }, process.env.JWT_SECRET, { expiresIn: '1h' })
            
        })
        

    } catch (error) {
        next(error)
    }
}