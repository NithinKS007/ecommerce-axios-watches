const isAdminLogin = async (req, res, next) => {
  try {
    if (req.session.adminId) {
      return next();
    } else {
      return res.redirect("/admin/signin");
    }
  } catch (error) {
    console.log("error from the admin isAdminLogin middleware", error.message);

    return res.status(500).render("admin/500");
  }
};

const isAdminLogout = async (req, res, next) => {
  try {
    if (req.session.adminId) {
      return res.redirect("/admin/dashboard");
    } else {
      return next();
    }
  } catch (error) {
    console.error("Error from isAdminLogout middleware:", error.message);

    return res.status(500).render("admin/500");
  }
};

module.exports = {
  isAdminLogin,
  isAdminLogout,
};
