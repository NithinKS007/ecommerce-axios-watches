const express = require("express");
const connectDB = require("./config/databaseConfig");

const sessionConfig = require("./config/sessionConfig");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const { setUserGlobal } = require("./middleware/setUserGlobalMiddleware");
const morgan = require("morgan");

const passport = require("passport");

require("dotenv").config();
const app = express();

const PORT = process.env.PORT;

//required here because of google authentication
require("./middleware/userAuthMiddleware");

//connecting to mongodb
connectDB();

app.use((req, res, next) => {
  res.locals.searchProduct = "";
  next();
});

//setting the viewengine
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));
app.use(express.static("public/assets"));
app.use(morgan("dev"));
// sweet alert js file from the installed npm install sweetalert2 library
app.use("/modules", express.static("node_modules"));

app.use(express.urlencoded({ extended: true }));

//configuring the session
app.use(sessionConfig);

//Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//setting the user globally
app.use(setUserGlobal);

//using user routes
app.use("/", userRoute);
//using admin routes
app.use("/admin", adminRoute);

//server running on port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
