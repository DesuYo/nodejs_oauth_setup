const dotenv = require('dotenv').config()

const server = require('./server')
const { connect } = require('./db')

;(async () => {
    const { databaseName } = await connect()
    console.log('\x1b[36mConnected to <\x1b[35m%s\x1b[36m> database.', databaseName)
    const serverPort = process.env.PORT || 777
    server.listen(serverPort, () => 
        console.log('\x1b[36mServer is going nuts on port <\x1b[35m%s\x1b[36m>.', serverPort)
    )
})()
    .catch(error => console.log('\x1b[31mERROR in <index.js>', error))