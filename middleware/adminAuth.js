// admin authentication 

const isAdminLogin = async (req, res, next) => {
  try {
    if (!req.session.adminId) {

      console.log("Access denied for admin. Admin ID not found.");

     return res.status(403).send("Access Denied");

    } 
    next()
  } catch (error) {

    console.log("error from the admin isAdminLogin middleware", error.message);

    return res.status(500).send("Internal Server Error");

  }
};



const isAdminLogout = async (req, res, next) => {

  try {

    if (req.session.adminId) {

      console.log("Access denied for admin logout. Admin is still logged in.")

      return res.status(403).send("Access Denied");

    }
    next()
  } catch (error) {

    console.error("Error from isAdminLogout middleware:", error.message);

    return res.status(500).send("Internal Server Error");
    
  }
};

module.exports = {
  isAdminLogin,
  isAdminLogout,
};
