# MERN Ecommerce Website 🛍️

A complete MERN (MongoDB, Express, React, Node.js) stack ecommerce application with professional Amazon-like UI built with TailwindCSS.

## Features ✨

### User Features
- **User Authentication**: Register, login, logout with JWT
- **Product Browsing**: Search, filter by category, price range, and sort
- **Product Details**: View detailed product information with reviews and ratings
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout**: Order placement with shipping address
- **Order Management**: View order history and status
- **Wishlist**: Save favorite products
- **Responsive Design**: Mobile-friendly TailwindCSS styling

### Admin Features
- **Dashboard**: View stats (users, products, orders, revenue)
- **Product Management**: CRUD operations for products
- **Order Management**: View and update order status
- **User Management**: View users and assign roles

## Tech Stack 🚀

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Document database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication with cookies
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud image storage
- **Razorpay** - Payment gateway (mock)

### Frontend
- **React 18.2** - UI library
- **React Router 6.15** - Routing
- **Redux Toolkit 1.9.7** - State management
- **TailwindCSS 3.3** - CSS styling
- **Axios** - HTTP client
- **PostCSS** - CSS processing

## Project Structure 📁

```
Ecommercewebsite/
├── backend/
│   ├── config/
│   │   ├── db.js (MongoDB connection)
│   │   └── cloudinary.js (Cloudinary setup)
│   ├── controllers/ (Business logic)
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── adminController.js
│   │   └── ...
│   ├── models/ (Database schemas)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   └── ...
│   ├── routes/ (API endpoints)
│   ├── middleware/ (Authentication, error handling)
│   ├── utils/ (Helper functions)
│   ├── server.js (Entry point)
│   ├── .env (Environment variables)
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Header.js (Navigation bar)
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Products.js (with filters)
    │   │   ├── ProductDetail.js
    │   │   ├── Cart.js
    │   │   ├── Checkout.js
    │   │   ├── Orders.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── admin/ (Admin pages)
    │   ├── redux/
    │   │   ├── store.js
    │   │   ├── authSlice.js
    │   │   └── cartSlice.js
    │   ├── services/
    │   │   └── api.js (API calls)
    │   ├── App.js
    │   ├── index.js
    │   ├── index.css
    │   └── ...
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env
    └── package.json
```

## Installation & Setup 🔧

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file** (already created with defaults)
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/mern-ecommerce
JWT_SECRET=your-secret-key-change-this-in-production
CLOUDINARY_NAME=demo
CLOUDINARY_API_KEY=874837483274837
CLOUDINARY_API_SECRET=a676b67565c6767a6767d6767f67671
RAZORPAY_KEY_ID=rzp_test_key
RAZORPAY_KEY_SECRET=rzp_test_secret
```

4. **Start MongoDB** (if using local MongoDB)
```bash
# On Windows
mongod

# On Mac/Linux
brew services start mongodb-community
```

5. **Start the server**
```bash
npm run dev
```

Backend runs on: **http://localhost:5001**

### Frontend Setup

1. **Navigate to frontend folder**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **.env file** (already created)
```env
REACT_APP_API_URL=http://localhost:5001/api
```

4. **Start the development server**
```bash
npm start
```

Frontend runs on: **http://localhost:3000**

## API Endpoints 📡

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `POST /api/products/:id/reviews` - Add review

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `POST /api/orders/verify` - Verify payment
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/products` - Get all products

## Key Features Implementation 🎯

### 1. **Professional UI with TailwindCSS**
   - Amazon-like color scheme (blue #131921, orange #FF9900)
   - Responsive grid layouts (4 col desktop, 2 col tablet, 1 col mobile)
   - Sticky navigation header with search and user menu
   - Product cards with hover effects and ratings

### 2. **Advanced Product Filtering**
   - Search by keywords (indexed text search in MongoDB)
   - Filter by category dropdown
   - Price range filter with min/max inputs
   - Sort options (latest, price, rating)
   - Pagination with numbered buttons

### 3. **State Management with Redux**
   - Authentication state (user, isAuthenticated)
   - Cart state (items, total)
   - Centralized store configuration

### 4. **Secure Authentication**
   - Password hashing with bcryptjs
   - JWT tokens stored in cookies
   - Protected routes and admin-only endpoints
   - Role-based access control (user/admin)

### 5. **Order Management**
   - Order creation with cart items
   - Razorpay payment integration (mock)
   - Order status tracking (pending, confirmed, shipped, delivered)
   - User order history

## Usage Guide 👥

### As a Regular User

1. **Register/Login**
   - Click "Account & Lists" → "Create Account"
   - Or "Sign In" if already registered

2. **Browse Products**
   - Use search bar to find products
   - Filter by category, price, rating
   - Sort by latest, price, or rating

3. **Make a Purchase**
   - View product details with reviews
   - Add to cart with desired quantity
   - View cart and proceed to checkout
   - Enter shipping address
   - Place order (payment mock in demo)

4. **Track Orders**
   - Click "Your Orders" to view order history
   - See order status and delivery updates

### As an Admin

1. **Login as Admin**
   - Use admin account credentials
   - Click "Admin Dashboard" from account menu

2. **Manage Dashboard**
   - View total users, products, orders, revenue

3. **Manage Products**
   - View all products with their details

4. **Manage Orders**
   - View all orders and update statuses

5. **Manage Users**
   - View all users and delete if needed

## Testing 🧪

### Test Credentials (Create Your Own)
1. Register with email and password
2. Login with same credentials
3. For admin features, update user role directly in database

### Test Features
1. **Search**: Try searching for "electronics", "books", etc.
2. **Filters**: Select category and adjust price range
3. **Cart**: Add multiple items with different quantities
4. **Checkout**: Fill shipping address and place order
5. **Admin**: Create admin user and access admin panel

## Performance Optimizations ⚡

- Text indexing on Product model for fast search
- Pagination to handle large product lists
- Lazy loading of pages with React Router
- Image optimization with Cloudinary
- Efficient Redux state management
- CSS purging with TailwindCSS

## Security Features 🔒

- JWT authentication with httpOnly cookies
- Password hashing with bcryptjs (salt rounds: 10)
- Admin middleware for protected routes
- CORS enabled for localhost:3000
- Environment variables for sensitive data
- Input validation on backend

## Future Enhancements 🚀

- [ ] Email notifications for orders
- [ ] Real Razorpay integration
- [ ] Advanced analytics in admin panel
- [ ] Wishlist management UI
- [ ] Newsletter subscription
- [ ] Product reviews with images
- [ ] Inventory tracking
- [ ] Discount coupons
- [ ] Multiple payment methods
- [ ] Order refunds and returns

## Troubleshooting 🔧

### Port Already in Use
- Change PORT in backend/.env
- Update REACT_APP_API_URL in frontend/.env

### MongoDB Connection Error
- Ensure MongoDB is running locally or connection string is correct
- Check MONGO_URI in .env

### npm install fails
- Delete node_modules and package-lock.json
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Frontend not connecting to backend
- Verify backend is running on http://localhost:5001
- Check REACT_APP_API_URL in frontend/.env
- Check CORS settings in backend/server.js

## License 📄

This project is open source and available for educational purposes.

## Support 💬

For issues or questions, please refer to the code comments or reach out through GitHub issues.

---

**Happy Shopping! 🛍️**
