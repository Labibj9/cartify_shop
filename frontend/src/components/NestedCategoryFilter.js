import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';

// Recursive category tree item component
function CategoryTreeItem({ category, selectedCategory, onSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center py-2 px-3 rounded-md hover:bg-gray-100 transition ${
          selectedCategory === category._id ? 'bg-amazon-orange text-white' : ''
        }`}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mr-2 text-sm font-bold cursor-pointer"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="mr-2 w-4"></span>}

        <button
          onClick={() => onSelect(category._id)}
          className="flex-1 text-left text-sm font-medium hover:underline"
        >
          {category.name}
        </button>
      </div>

      {/* Subcategories */}
      {hasChildren && expanded && (
        <div>
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child._id}
              category={child}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main filter component
function NestedCategoryFilter({ selectedCategory, onCategorySelect, onClearFilters }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await categoryService.getCategories();
      setCategories(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-md p-4 sticky top-24 max-h-[calc(100vh-100px)] overflow-y-auto">
        <h2 className="text-lg font-bold text-amazon-blue mb-4 border-b-2 pb-2">Categories</h2>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 p-3 bg-red-50 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="space-y-1">
            {/* All Categories Option */}
            <div
              className={`flex items-center py-2 px-3 rounded-md hover:bg-gray-100 transition cursor-pointer ${
                !selectedCategory ? 'bg-amazon-orange text-white' : ''
              }`}
              onClick={() => onCategorySelect(null)}
            >
              <span className="text-sm font-medium">All Categories</span>
            </div>

            {/* Category Tree */}
            {categories.length > 0 ? (
              categories.map((category) => (
                <CategoryTreeItem
                  key={category._id}
                  category={category}
                  selectedCategory={selectedCategory}
                  onSelect={onCategorySelect}
                  level={0}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No categories available</p>
            )}
          </div>
        )}

        {/* Clear Button */}
        {selectedCategory && (
          <button
            onClick={() => {
              onCategorySelect(null);
              onClearFilters?.();
            }}
            className="w-full mt-4 border-2 border-amazon-blue text-amazon-blue hover:bg-blue-50 font-semibold py-2 rounded-md transition text-sm"
          >
            Clear Category
          </button>
        )}
      </div>
    </div>
  );
}

export default NestedCategoryFilter;
