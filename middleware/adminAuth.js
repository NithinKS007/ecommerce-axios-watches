// admin authentication 

const isAdminLogin = async (req, res, next) => {
  try {
    if (req.session.adminId) {

      if (req.path === "/signin") {
        return res.redirect("/admin/dashboard");
      }
      return next();

    } 
    if (!req.session.adminId) {

      if (req.path !== "/signin") {

        return res.redirect("/admin/signin");

      }

    }
    return next();
  } catch (error) {

    console.log("error from the admin isAdminLogin middleware", error.message);

     return res.status(500).render("user/500");

  }
};



const isAdminLogout = async (req, res, next) => {

  try {

    if (req.session.adminId) {

      if (req.path === "/signin" || req.path === "/signup") {
        return res.redirect("/admin/dashboard");
      }
      return next();

    }
    if (req.path === "/signin" || req.path === "/signup") {
      return next();
    }
    return res.redirect("/signin");
  } catch (error) {

    console.error("Error from isAdminLogout middleware:", error.message);

    return res.status(500).render("user/500");
    
  }
};

module.exports = {
  isAdminLogin,
  isAdminLogout,
};
