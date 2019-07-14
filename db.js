const { connect, Db } = require('mongodb')

/** @type { Db } db */
let db = null

exports.connect = () => connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true })
    .then(mongoClient => db = mongoClient.db())

exports.getDB = () => db