## ⌚ Axios Watches: Full Stack E-commerce Web Application

## 🚀 Project Overview

Axios Watches is a full-stack e-commerce website specializing in watches. This project demonstrates my skills in web development using the MERN stack and various modern web technologies.

## 🌟 Live Demo

[Visit Axios Watches]()

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript, EJS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Payment Integration**: Razorpay
- **Version Control**: Git
- **Authentication**: Email OTP verification, Bcrypt encryption, Google authentication

## ✨ Key Features

- Secure User Authentication
- OTP-Based Verification
- Product Management
- Shopping Cart
- Wishlist
- Search and Filter Functionality
- Responsive Design
- Real-Time Stock Updates
- Payment Gateway Integration (Razorpay)
- Secure Checkout Process
- Order Management
- User Profile and Order Tracking
- Product Return Management
- Discounts and Coupons
- Admin Dashboard
- Analytics and Reporting

## 🔧 Key Technologies and Libraries

- **bcrypt**: Library for hashing passwords and securely storing them.
- **crypto**: Node.js module for cryptographic functions, used for encryption and decryption.
- **dayjs**: A lightweight date library for working with dates and times.
- **dotenv**: Loads environment variables from a `.env` file into `process.env`.
- **ejs**: Embedded JavaScript templating engine for rendering HTML views.
- **express**: Web framework for building the server and handling routes.
- **express-session**: Middleware for handling user sessions in Express.
- **express-validator**: A set of middleware for validating and sanitizing user input.
- **mongodb**: NoSQL database for storing data.
- **mongoose**: ODM (Object Data Modeling) library for MongoDB and Node.js.
- **morgan**: HTTP request logger middleware for Node.js.
- **multer**: Middleware for handling multipart/form-data, used for file uploads.
- **nodemailer**: Module for sending emails from your application.
- **otp-generator**: Library for generating one-time passwords (OTPs).
- **passport**: Authentication middleware for Node.js.
- **passport-google-oauth2**: Passport strategy for Google OAuth2 authentication.
- **razorpay**: Payment gateway for processing payments.
- **sweetalert2**: Library for displaying beautiful and customizable alerts.
- **uuid**: Library for generating unique identifiers (UUIDs).

### Prerequisites

- Node.js
- MongoDB installed and running
- Razorpay Account
- Google Account
- Git

## ⚙️ Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ecommerce-axios-watches.git
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=7000

# Database configuration (MongoDB Atlas or another database)
DATABASE_CONFIG=mmongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority

# Google Authentication Config
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:7000/google/callback

# Email Service Config
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Razorpay Payment Gateway Config
RAZORPAY_ID_KEY=rzp_test_yourkeyhere
RAZORPAY_SECRET_KEY=your-secret-key-here

```

## 🏃‍♂️ Running the Server

Development mode:

```bash
npm start
```

The server will start on `http://localhost:7000` by default.

## 📁 Project Structure

```
AXIOS WATCHES
│── .env                          # Environment variables configuration
│── .gitignore                    # Git ignore file
│── app.js                        # Main entry point of the application
│── config                        # Configuration files
│   │── databaseConfig.js         # Database connection configurations
│   └── sessionConfig.js          # Session management configurations
│── controllers                   # Controllers for handling requests
│   │── addressController.js      # Address management
│   │── adminAuthController.js    # Admin authentication
│   │── adminOrderController.js   # Admin order management
│   │── bestSellersController.js  # Best-selling products
│   │── cartController.js         # Shopping cart functionality
│   │── categoryBrandController.js# Category and brand management
│   │── checkoutOnline            # Online payment processing
│   │   PaymentController.js
│   │── couponController.js       # Coupon management
│   │── dashboardController.js    # Admin dashboard data handling
│   │── homePageController.js     # Home page data handling
│   │── offerController.js        # Offers and discounts
│   │── productController.js      # Product management
│   │── userAuthController.js     # User authentication
│   │── userController.js         # User settings
│   │── userOrderController.js    # User order management
│   │── userProfileController.js  # User profile handling
│   │── walletController.js       # Wallet management
│   └── wishListController.js     # Wish list management
│── middleware                    # Middleware for request handling
│   │── adminAuth.js              # Admin authentication check
│   │── cacheClearMiddleWare.js   # Cache clearing middleware
│   │── handleCartUpdate.js       # Handles cart updates by deciding the action based on the request body.
│   │── handleEditCategoryBrand.js# Handles category and brand edits based on the request body.
│   │── handleExistCategoryBrand.js# Category and brand existing one validation
│   │── handleReturnStatus.js     # Handles return status updates based on the request status.
│   │── handleSearch.js           # Search query handling
│   │── isBlocked.js              # Blocked user check
│   │── setUserGlobal.js          # Set global user data
│   │── softDeletehandle.js       # Soft delete functionality
│   └── userAuth.js               # User authentication check
│── models                        # Database models (Mongoose schemas)
│   │── addressModel.js           # Address model
│   │── adminModel.js             # Admin model
│   │── brandModel.js             # Brand model
│   │── cartModel.js              # Cart model
│   │── categoryModel.js          # Category model
│   │── couponModel.js            # Coupon model
│   │── onlineTransactionModel.js # Online transactions model
│   │── orderModel.js             # Order model
│   │── otpModel.js               # OTP model
│   │── productModel.js           # Product model
│   │── returnOrderModel.js       # Return order model
│   │── userModel.js              # User model
│   │── walletModel.js            # Wallet model
│   └── wishList.js               # Wish list model
│── node_modules                  # Node.js dependencies
│── README.md                     # Project overview and instructions
│── package.json                  # Project dependencies and scripts
│── package-lock.json             # Auto-generated file for locked dependencies
│── routes                        # Routing files
│   │── adminRoute.js             # Admin-specific routes
│   └── userRoute.js              # User-specific routes
│── utils                         # Utility functions and services
│   │── emailService.js           # Email service (Nodemailer)
│   │── escapeSpecialChars.js     # Utility to escape special characters
│   │── getEnumValues.js          # Utility to get enum values
│   │── handleForgotPassword.js   # Handle forgot password functionality
│   │── hashPassword.js           # Password hashing utility
│   │── imageUpload.js            # Image upload handler
│   │── otpManager.js             # OTP management (generation, validation)
│   │── priceSummary.js           # Price summary calculation
│   └── razorpayService.js        # Razorpay payment gateway integration
└── views                         # EJS views for rendering HTML pages
    │── admin                     # Admin panel views
    │   │── 400.ejs               # Error page (400)
    │   │── 500.ejs               # Error page (500)
    │   │── addCategoryOffer.ejs   # Add category offer page
    │   │── addCoupon.ejs          # Add coupon page
    │   │── addProduct.ejs         # Add product page
    │   │── addProductOffer.ejs    # Add product offer page
    │   │── brandBestSelling.ejs   # Brand best-selling products
    │   │── brandCategoryManagement.ejs # Brand category management
    │   │── categoryBestSelling.ejs# Category best-selling products
    │   │── categoryOfferList.ejs  # Category offer listing
    │   │── couponList.ejs         # Coupon list page
    │   │── customerList.ejs       # List of customers
    │   │── dashboard.ejs          # Admin dashboard page
    │   │── editCategoryOffer.ejs  # Edit category offer
    │   │── editProduct.ejs        # Edit product page
    │   │── editProductOffer.ejs   # Edit product offer page
    │   │── orderDetailsPage.ejs   # Order details page
    │   │── orderList.ejs          # Order list page
    │   │── productBestSelling.ejs # Best-selling products list
    │   │── productList.ejs        # Product list page
    │   │── productOfferList.ejs   # Product offer list page
    │   │── returnedOrder.ejs      # Returned order list
    │   └── signin.ejs             # Admin sign-in page
    │── layouts                    # Layout templates for admin and user
    │   │── adminLayouts           # Admin layout templates
    │   │   │── footer.ejs         # Admin footer
    │   │   │── header.ejs         # Admin header
    │   │   │── searchbar.ejs      # Admin search bar
    │   │   └── sidebar.ejs        # Admin sidebar
    │   └── userLayouts            # User layout templates
    │       │── footer.ejs         # User footer
    │       │── header.ejs         # User header
    │       │── navbar1.ejs        # User navigation bar
    │       └── sidebar.ejs        # User sidebar
    └── user                       # User-facing views
        │── 404.ejs                # Error page (404)
        │── 500.ejs                # Error page (500)
        │── addAddress.ejs         # Add address page
        │── address.ejs            # Address management page
        │── cart.ejs               # Shopping cart page
        │── checkout.ejs           # Checkout page
        │── forgotPassword.ejs     # Forgot password page
        │── home.ejs               # Home page
        │── orderDetails.ejs       # Order details page
        │── orders.ejs             # User order list
        │── otpVerification.ejs    # OTP verification page
        │── paymentFailure.ejs     # Payment failure page
        │── placeOrder.ejs         # Place order page
        │── productDetails.ejs     # Product details page
        │── profile.ejs            # User profile page
        │── resetPassword.ejs      # Reset password page
        │── retryCheckout.ejs      # Retry checkout page
        │── showCase.ejs           # Product showcase
        │── signin.ejs             # User sign-in page
        │── signup.ejs             # User sign-up page
        │── wallet.ejs             # User wallet page
        └── wishList.ejs           # User wishlist page

```

## 🔗 API Endpoints

## API Routes Documentation

### Admin Routes

#### **Authentication**

- **POST /signup** : Register a new admin user.
- **GET /signin** : Load admin login page (GET request).
- **POST /signin** : Admin login with credentials.
- **GET /signout** : Log out the admin.

#### **Admin Dashboard & User Management**

- **GET /dashboard** : Load admin dashboard.
- **GET /customerlist** : Retrieve a list of customers.
- **PATCH /customerlist** : Block or unblock a customer.

#### **Brand & Category Management**

- **GET /brandCategoryManagement** : View all categories and brands.
- **PATCH /brandCategoryManagement** : Soft delete a category or brand.
- **PUT /brandCategoryManagement** : Edit a category or brand.
- **POST /brandCategoryManagement** : Add a new category or brand.
- **GET /brandCategoryExists** : Check if a category or brand exists.

#### **Product Management**

- **GET /products** : List all products.
- **POST /addProducts** : Add a new product.
- **GET /editProduct** : Load product for editing.
- **PUT /editProduct** : Update product details.
- **DELETE /removeProductImage** : Remove a product image.

#### **Order Management**

- **GET /orders** : List all orders.
- **GET /orderDetailsPage** : View order details.
- **POST /orderDetailsPage** : Update order status.

#### **Coupon Management**

- **GET /couponManagement** : View all coupons.
- **POST /addCoupon** : Add a new coupon.
- **PATCH /couponManagement** : Activate or deactivate a coupon.

#### **Product Offer Management**

- **GET /productOffer** : List all product offers.
- **POST /addProductOffer** : Add a new product offer.
- **PATCH /productOffer** : Activate or deactivate a product offer.
- **GET /editProductOffer** : Edit a product offer.
- **PUT /editProductOffer** : Update a product offer.

#### **Return & Refund Management**

- **GET /updateReturnStatus** : View return status of orders.
- **PATCH /updateReturnStatus** : Approve or reject return requests.

#### **Sales Reports**

- **GET /salesReport** : Fetch sales report.
- **GET /bestSellers** : View best-selling products.

#### **Category Offer Management**

- **GET /categoryOffer** : View all category offers.
- **POST /addCategoryOffer** : Add a new category offer.
- **PATCH /categoryOffer** : Activate or deactivate a category offer.
- **GET /editCategoryOffer** : Edit a category offer.
- **PUT /editCategoryOffer** : Update a category offer.

---

### User Routes

#### **Authentication**

- **GET /signup** : Load user registration page.
- **POST /signup** : Register a new user.
- **POST /verifyOtp** : Verify OTP for user signup.
- **GET /signin** : Load user login page.
- **POST /signin** : User login with credentials.
- **GET /signout** : Log out the user.
- **GET /auth/google** : Google OAuth login.
- **GET /google/callback** : Handle Google OAuth callback.

#### **Password Management**

- **GET /forgotPassword** : Load forgot password page.
- **PATCH /forgotPassword** : Handle forgot password.
- **GET /resetPassword** : Load reset password page.
- **PATCH /resetPassword** : Reset user password.

#### **Home & Product Browsing**

- **GET /home** : Load the homepage for logged-in users.
- **GET /showcase** : View product showcase.
- **GET /productDetails** : View detailed product info.

#### **Cart & Wishlist**

- **POST /productDetails** : Add product to cart.
- **GET /cart** : View items in cart.
- **DELETE /cart** : Remove item from cart.
- **PATCH /cart** : Update cart (quantity, selection).
- **POST /cart/applyCoupon** : Apply coupon to cart.
- **DELETE /cart/removeCoupon** : Remove coupon from cart.
- **GET /wishList** : View wishlist.
- **POST /wishList** : Add item to wishlist.
- **DELETE /wishList** : Remove item from wishlist.

#### **Checkout & Orders**

- **GET /checkout** : View checkout page.
- **POST /checkout/addAddress** : Add a new address for checkout.
- **POST /checkout** : Place an order.
- **GET /orders** : View all orders.
- **GET /orderDetails** : View order details.
- **PATCH /orders** : Update order status (cancel a product).
- **PUT /orders** : Cancel an entire order.
- **PATCH /return** : Request product return.

#### **Profile Management**

- **GET /profile** : View user profile.
- **PUT /profile** : Update user profile.
- **PATCH /profile** : Change user password.
- **GET /address** : View user addresses.
- **POST /addAddress** : Add new address.
- **PUT /editAddress** : Edit existing address.
- **DELETE /address** : Delete an address.

#### **Payment & Wallet**

- **POST /verifyOnlinePayment** : Verify online payment status.
- **GET /paymentFailure** : Handle payment failure page.
- **PATCH /paymentFailure** : Retry or handle payment failure.
- **GET /wallet** : View wallet balance.
- **PATCH /retryPayment** : Retry payment for failed transactions.

#### **Advanced Search & Filters**

- **GET /filter** : Apply advanced search filters for products.

## 💾 Database Schema

- **addressModel.js** : //Defines the schema for storing user addresses.

- **adminModel.js** : //Defines the schema for storing admin user details.

- **brandModel.js** : //Defines the schema for storing brand information.

- **cartModel.js** : //Defines the schema for handling user cart data.

- **categoryModel.js** : //Defines the schema for storing product categories.

- **couponModel.js** : //Defines the schema for storing coupon details and redemption rules.

- **onlineTransactionModel.js** : //Defines the schema for handling online transaction records.

- **orderModel.js** : //Defines the schema for managing user orders and their status.

- **otpModel.js** : //Defines the schema for one-time password (OTP) generation and validation.

- **productModel.js** : //Defines the schema for storing product details.

- **returnOrderModel.js** : Defines the schema for managing return orders.

- **userModel.js** : Defines the schema for storing user details.

- **walletModel.js** : Defines the schema for user wallet balance and transaction records.

- **wishListModel.js** : Defines the schema for managing user wish list items.

## 🔒 Security

- File uploads are restricted to Images only
- Multer middleware for secure file handling
- Session & Passport js for authentication

## 🛠 Development

### Adding New Features

1. Create necessary route in `routes/`
2. Implement controller logic in `controllers/`
3. Add any required middleware in `middlewares/`
4. Update models if needed in `models/`

### Code Style

- Use async/await for asynchronous operations
- Follow the existing project structure
- Use meaningful variable and function names

### 📦 Package Analysis

### Current Dependencies Analysis

### Required Packages (Keep)

```json
{
  "bcrypt": "^5.1.1", // Password hashing library
  "bcryptjs": "^2.4.3", // Alternative bcrypt implementation (lighter version)
  "crypto": "^1.0.1", // Core cryptographic functionality
  "dayjs": "^1.11.12", // Lightweight date utility library
  "dotenv": "^16.4.5", // Loads environment variables from a .env file
  "ejs": "^3.1.10", // Embedded JavaScript templating engine
  "express": "^4.19.2", // Web framework for building APIs
  "express-session": "^1.18.0", // Middleware to handle user sessions in Express.js
  "express-validator": "^7.1.0", // Middleware for validating and sanitizing user inputs
  "mongodb": "^6.8.1", // MongoDB database driver for Node.js
  "mongoose": "^8.4.1", // MongoDB object modeling for Node.js
  "morgan": "^1.10.0", // HTTP request logger middleware for node.js
  "multer": "^1.4.5-lts.1", // Middleware for handling file uploads
  "nodemailer": "^6.9.13", // Email sending library for Node.js
  "otp-generator": "^4.0.1", // Library to generate one-time passwords
  "passport": "^0.7.0", // Authentication middleware for Node.js
  "passport-google-oauth2": "^0.2.0", // Passport strategy for Google OAuth 2.0 authentication
  "path": "^0.12.7", // Utility library for working with file and directory paths
  "razorpay": "^2.9.4", // Razorpay API client for payment gateway integration
  "sweetalert2": "^11.12.1", // Library for creating beautiful, responsive alerts
  "uuid": "^10.0.0" // Library for generating universally unique identifiers (UUIDs)
}
```

## Development Dependencies (Keep)

```json

{
  "nodemon": "^3.1.10" // Development tool for automatic server restart on code changes
}

```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## 🆘 Support

For support, please create an issue in the repository or contact the maintainers.

## 🙏 Acknowledgements

Special thanks to:

- Brototype Bootcamp
- Industry experts who provided valuable feedback
