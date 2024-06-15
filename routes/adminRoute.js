const express = require('express')

const adminRoute = express.Router()


adminRoute.get('/', (req, res) => {
    
    res.send("hello admin...")
})

module.exports = adminRoute