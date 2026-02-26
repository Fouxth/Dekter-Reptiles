import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Notification Helper
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Search Handler
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Cart Functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`เพิ่ม ${product.name} ลงในตะกร้าแล้ว`);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <BrowserRouter>
      <CustomerAuthProvider>
        <Routes>
          <Route path="/" element={
            <Layout
              cartItemCount={cartItemCount}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              searchQuery={searchQuery}
              handleSearch={handleSearch}
              toast={toast}
            />
          }>
            <Route index element={<Home addToCart={addToCart} />} />
            <Route path="shop" element={<Shop searchQuery={searchQuery} addToCart={addToCart} />} />
            <Route path="product/:id" element={<ProductDetail addToCart={addToCart} />} />
            <Route path="cart" element={
              <Cart
                cart={cart}
                setCart={setCart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                cartTotal={cartTotal}
                cartItemCount={cartItemCount}
              />
            } />
            <Route path="checkout-success" element={<CheckoutSuccess />} />
            <Route path="articles" element={<Articles />} />
            <Route path="article/:id" element={<ArticleDetail />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </CustomerAuthProvider>
    </BrowserRouter>
  );
}

export default App;
