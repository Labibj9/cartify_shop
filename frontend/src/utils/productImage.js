const categoryImageMap = {
  // Mobile/Phones
  mobiles: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80',
  phones: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80',
  mobile: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80',
  smartphone: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80',
  iphone: 'https://images.unsplash.com/photo-1694286723533-c3761bda-d84d-a0ca-c7c9-09d0364fdd5f?w=400&q=80',
  samsung: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80',
  google: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80',

  // Laptops
  laptops: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  laptop: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  notebook: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  macbook: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  dell: 'https://images.unsplash.com/photo-1588872657840-218e73e19b45?w=400&q=80',
  hp: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',
  asus: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',

  // TVs
  tvs: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',
  tv: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',
  television: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',
  oled: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',

  // Furniture
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  chairs: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80',
  chair: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80',
  ergonomic: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80',
  gaming: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
  
  tables: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=400&q=80',
  table: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=400&q=80',
  dining: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=400&q=80',

  // Fashion
  fashion: 'https://images.unsplash.com/photo-1591047990852-258f50dee5fb?w=400&q=80',
  shirt: 'https://images.unsplash.com/photo-1591047990852-258f50dee5fb?w=400&q=80',
  jeans: 'https://images.unsplash.com/photo-1542272604-787c62002397?w=400&q=80',
  men: 'https://images.unsplash.com/photo-1488161622105-6a60a18cdbf0?w=400&q=80',
  women: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',

  // Books
  books: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80',
  book: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80',
  fiction: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80',
};

const getCategoryFallbackImage = (categoryName = '', title = '') => {
  const searchText = `${categoryName} ${title}`.toLowerCase();
  
  for (const [key, imageUrl] of Object.entries(categoryImageMap)) {
    if (searchText.includes(key)) {
      return imageUrl;
    }
  }
  
  return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80';
};

const localFallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cpath d='M80 280l70-85 60 65 35-40 75 60H80z' fill='%239ca3af'/%3E%3Ccircle cx='145' cy='140' r='26' fill='%23d1d5db'/%3E%3C/svg%3E";

const normalizeImageUrl = (value) => {
  if (typeof value !== 'string') return '';

  const url = value.trim();
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (url.startsWith('/')) {
    return `http://localhost:5001${url}`;
  }

  return `https://${url}`;
};

// Get product image URL - prioritizes local uploads, then Cloudinary, then fallback
export const getProductImageUrl = (product) => {
  if (!product) return getCategoryFallbackImage();
  
  // Priority 1: Direct image field (supports local and remote URLs)
  if (product.image) {
    const normalized = normalizeImageUrl(product.image);
    if (normalized) return normalized;
  }
  
  // Priority 2: Cloudinary image from images array
  if (product.images && product.images.length > 0 && product.images[0].url) {
    const normalized = normalizeImageUrl(product.images[0].url);
    if (normalized) return normalized;
  }
  
  // Priority 3: Category-based fallback
  return getCategoryFallbackImage(product.category?.name, product.title);
};

// Error handler for image load failures
export const getProductImageWithFallback = (event, product) => {
  const target = event?.currentTarget;
  if (!target || !target.src) return;
  
  const fallbackUrl = getCategoryFallbackImage(product?.category?.name, product?.title);
  if (target.src !== fallbackUrl && target.dataset.fallbackStep !== '1') {
    target.dataset.fallbackStep = '1';
    target.src = fallbackUrl;
    return;
  }

  // Final fallback that does not depend on network/external domains.
  if (target.dataset.fallbackStep !== '2') {
    target.dataset.fallbackStep = '2';
    target.src = localFallbackImage;
  }
};

const buildKeywords = (title = '', categoryName = '') =>
  `${title || 'Product'} ${categoryName || ''}`.trim();

export const getUnsplashSourceUrl = (title = '', categoryName = '') =>
  `https://source.unsplash.com/400x400/?${encodeURIComponent(buildKeywords(title, categoryName))}`;
