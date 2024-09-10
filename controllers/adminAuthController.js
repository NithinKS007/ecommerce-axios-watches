const bcrypt = require('bcrypt');

const admin = require('../models/adminModel');
const securePassword = require('../utils/hashPassword')

const loadLogin = (req,res) =>{
    try {

       return  res.status(200).render('admin/signin')

    } catch (error) {

        console.log(`cannot load login page of the admin`,error.message);
        
        return res.status(500).render("admin/500")
    }
}


const registerAdmin = async (req,res) =>{

    const {fname,lname,email,password,phone} = req.body

    try {

        const hashedPassword = await securePassword(password)

        const regAdmin = await new admin({

            fname:fname,
            lname:lname,
            email:email,
            password:hashedPassword,
            phone:phone

        })

        await regAdmin.save()

         
    } catch (error) {

        console.log(`error while registering admin`,error.message);

        return res.status(500).render("admin/500")
        
    }
}


const verifyAdmin = async (req,res) =>{

    try {

        const {email,password} = req.body
  
        const adminData = await admin.findOne({email:email})

        if(!adminData){
              
           return res.status(401).render("admin/signin",{message:"Admin does not exist"})
  
        }

        const passwordMatch = await bcrypt.compare(password,adminData.password)

        if(!passwordMatch){

            return res.status(401).render("admin/signin",{message:"Email or password is incorrect"})
 
         }
        
                req.session.adminId = adminData._id;

                req.session.successMessage = "Login successful! Welcome back admin"
                              
         return res.status(200).redirect("/admin/dashboard")

    } catch (error) {

        console.log(`error while verifying and finding the admin`,error.message);
        
        return res.status(500).render("admin/500")
    }

}
 

const isSignout = async (req,res) =>{

    try {

        req.session.destroy()

       return res.status(200).redirect('/admin/signin')
        
    } catch (error) {
        
        console.log(`error while using the logging out function`,error.message);

        return res.status(500).render("admin/500")
    }

}

module.exports = {
    loadLogin,
    registerAdmin,
    verifyAdmin,
    isSignout
};
