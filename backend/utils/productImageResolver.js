const buildImageUrl = (query) =>
  `https://loremflickr.com/400/400/${encodeURIComponent(query).replace(/%20/g, ',')}`;

const resolveProductImage = (title = '', categoryName = '') => {
  const safeTitle = (title || 'product').trim();
  const safeCategory = (categoryName || '').trim();
  const query = safeCategory ? `${safeTitle} ${safeCategory}` : safeTitle;
  return buildImageUrl(query);
};

module.exports = {
  resolveProductImage,
};
