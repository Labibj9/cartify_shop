import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const featuredDeals = [
    {
      title: 'Smart Home Finds',
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=700&q=80',
    },
    {
      title: 'Tech Essentials',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&q=80',
    },
    {
      title: 'Fashion Picks',
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&q=80',
    },
    {
      title: 'Kitchen Upgrades',
      image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=700&q=80',
    },
  ];

  const spotlightCards = [
    {
      heading: 'Best Sellers in Clothing',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&q=80',
    },
    {
      heading: 'Up to 50% off Electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=700&q=80',
    },
    {
      heading: 'Customers’ Favorite Shoes',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80',
    },
    {
      heading: 'Home Storage Deals',
      image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=700&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-amazon-light">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-amazon-blue to-blue-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="hero-animate hero-animate-1 text-5xl md:text-6xl font-bold mb-4">Welcome to Cartify</h1>
          <p className="hero-animate hero-animate-2 text-xl md:text-2xl mb-8 text-gray-100">
            Discover amazing products at unbeatable prices
          </p>
          <Link
            to="/products"
            className="hero-animate hero-animate-3 inline-block bg-amazon-orange hover:bg-orange-600 text-amazon-blue font-bold px-8 py-4 rounded-lg text-lg transition-transform hover:scale-105"
          >
            🛍️ Shop Now
          </Link>
        </div>
      </div>

      {/* Featured Deals (Amazon-style) */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-amazon-blue">Top Deals & Featured Picks</h2>
            <Link to="/products" className="text-amazon-orange font-semibold hover:underline">
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredDeals.map((deal, idx) => (
              <Link
                key={idx}
                to="/products"
                className="group rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition"
              >
                <div className="h-44 overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=700&q=80';
                    }}
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-amazon-blue">{deal.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {spotlightCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-amazon-blue mb-3 leading-tight">{card.heading}</h3>
              <div className="rounded-md overflow-hidden h-56">
                <img src={card.image} alt={card.heading} className="w-full h-full object-cover" />
              </div>
              <Link to="/products" className="inline-block mt-3 text-amazon-orange font-semibold hover:underline">
                Shop now
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-center">
            <div className="text-5xl mb-4">🚚</div>
            <h3 className="text-2xl font-bold text-amazon-blue mb-3">Free Shipping</h3>
            <p className="text-gray-600 text-lg">On all orders above $500</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-2xl font-bold text-amazon-blue mb-3">Secure Payments</h3>
            <p className="text-gray-600 text-lg">Safe and secure transactions</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-amazon-blue mb-3">Easy Returns</h3>
            <p className="text-gray-600 text-lg">Hassle-free returns within 30 days</p>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white py-16 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-amazon-blue mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['📱 Electronics', '📚 Books', '👕 Clothing', '🎮 Gaming'].map((category, i) => (
              <Link
                key={i}
                to="/products"
                className="bg-amazon-light hover:bg-gray-200 rounded-lg p-8 text-center transition-all hover:scale-105 cursor-pointer shadow-md"
              >
                <div className="text-5xl mb-4">{category.split(' ')[0]}</div>
                <p className="text-lg font-semibold text-amazon-blue">{category.split(' ')[1]}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-amazon-blue text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-gray-100 mb-6">Get exclusive deals and updates delivered to your inbox</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-amazon-blue focus:outline-none focus:ring-2 focus:ring-amazon-orange"
            />
            <button className="bg-amazon-orange hover:bg-orange-600 text-amazon-blue font-bold px-6 py-3 rounded-lg transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-amazon-blue mb-4">Start Shopping Today</h2>
        <p className="text-gray-600 text-lg mb-8">Browse our wide selection of products and find amazing deals</p>
        <Link
          to="/products"
          className="inline-block bg-amazon-orange hover:bg-orange-600 text-amazon-blue font-bold px-8 py-4 rounded-lg text-lg transition-transform hover:scale-105"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}

export default Home;
