// Quick test script to verify category API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

async function testCategoryAPIs() {
  console.log('🧪 Testing Category API Endpoints...\n');
  
  try {
    // Test 1: Get all categories (should be empty initially)
    console.log('1. Testing GET /api/categories (nested tree)...');
    let res = await api.get('/categories');
    console.log('✅ Response:', JSON.stringify(res.data, null, 2));
    console.log('\n');

    // Test 2: Create a top-level category
    console.log('2. Creating top-level category "Electronics"...');
    res = await api.post('/categories', {
      name: 'Electronics',
      description: 'Electronic products and devices',
      displayOrder: 1,
    });
    const electronicsId = res.data.data._id;
    console.log('✅ Created:', electronicsId);
    console.log('\n');

    // Test 3: Create a subcategory
    console.log('3. Creating subcategory "Mobile Phones" under "Electronics"...');
    res = await api.post('/categories', {
      name: 'Mobile Phones',
      description: 'Smartphones and mobile devices',
      parentCategory: electronicsId,
      displayOrder: 1,
    });
    const mobilePhonesId = res.data.data._id;
    console.log('✅ Created:', mobilePhonesId);
    console.log('\n');

    // Test 4: Get nested tree structure
    console.log('4. Getting full nested category tree...');
    res = await api.get('/categories');
    console.log('✅ Tree Structure:', JSON.stringify(res.data.data, null, 2));
    console.log('\n');

    // Test 5: Get category by slug
    console.log('5. Getting category by slug "electronics"...');
    res = await api.get('/categories/slug/electronics');
    console.log('✅ Found:', res.data.data.name);
    console.log('\n');

    // Test 6: Get subcategories
    console.log('6. Getting subcategories of Electronics...');
    res = await api.get(`/categories/${electronicsId}/subcategories`);
    console.log('✅ Subcategories:', res.data.data.map(c => c.name));
    console.log('\n');

    console.log('🎉 All API tests passed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCategoryAPIs();
