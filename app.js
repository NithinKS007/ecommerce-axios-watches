const express = require('express')
const connectDB = require('./config/databaseConfig')

const sessionConfig = require('./config/sessionConfig')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')

require("dotenv").config();
const app = express()
const PORT = process.env.PORT;

//connecting to mongodb
connectDB()
  
//setting the viewengine
app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(express.static('public/assets'));


app.use(express.urlencoded({extended: true}))
   
app.use(sessionConfig)
//using user routes
app.use("/",userRoute)
//using admin routes
app.use("/admin",adminRoute)




//server running on port   
app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost: 4000`);

})