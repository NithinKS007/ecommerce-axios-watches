const session = require('express-session')

const sessionConfig = session({

        secret:"mysiteSessionSecret",
        resave: false,
        saveUninitialized: true,
    
})

module.exports =  sessionConfig 

