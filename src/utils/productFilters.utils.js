/**
 * Utility functions for pagination and filtering
 */

/**
 * Parse and validate pagination parameters
 */
export const parsePagination = (query = {}) => {
  let { page = 1, limit = 10 } = query;
  
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page
  
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Build filter object for product queries
 */
export const buildProductFilters = (query = {}) => {
  const filters = { isAvailable: true };
  
  // Category filter
  if (query.category_id) {
    filters.category_id = query.category_id;
  }
  
  // Price range filter
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) {
      const minPrice = parseFloat(query.minPrice);
      if (!isNaN(minPrice) && minPrice >= 0) {
        filters.price.$gte = minPrice;
      }
    }
    if (query.maxPrice) {
      const maxPrice = parseFloat(query.maxPrice);
      if (!isNaN(maxPrice) && maxPrice > 0) {
        filters.price.$lte = maxPrice;
      }
    }
  }
  
  // Rating filter
  if (query.minRating) {
    const minRating = parseFloat(query.minRating);
    if (!isNaN(minRating) && minRating >= 0 && minRating <= 5) {
      filters.averageRating = { $gte: minRating };
    }
  }
  
  // Weight range filter
  if (query.minWeight || query.maxWeight) {
    filters.weight = {};
    if (query.minWeight) {
      const minWeight = parseFloat(query.minWeight);
      if (!isNaN(minWeight) && minWeight > 0) {
        filters.weight.$gte = minWeight;
      }
    }
    if (query.maxWeight) {
      const maxWeight = parseFloat(query.maxWeight);
      if (!isNaN(maxWeight) && maxWeight > 0) {
        filters.weight.$lte = maxWeight;
      }
    }
  }
  
  // Size filter
  if (query.size) {
    const validSizes = ['S', 'M', 'L'];
    if (validSizes.includes(query.size.toUpperCase())) {
      filters.size = query.size.toUpperCase();
    }
  }
  
  // Allergen filter (exclude products with specific allergens)
  if (query.excludeAllergens) {
    const allergens = Array.isArray(query.excludeAllergens) 
      ? query.excludeAllergens 
      : query.excludeAllergens.split(',').map(a => a.trim());
    
    if (allergens.length > 0) {
      filters.allergens = { $not: { $elemMatch: { $in: allergens } } };
    }
  }
  
  // Fresh products only (not expired)
  if (query.freshOnly === 'true') {
    const now = new Date();
    filters.$expr = {
      $or: [
        { $eq: ['$shelfLife', null] },
        { $eq: ['$shelfLife', 0] },
        {
          $gt: [
            { $add: ['$createdAt', { $multiply: ['$shelfLife', 60 * 60 * 1000] }] },
            now
          ]
        }
      ]
    };
  }
  
  // Featured products
  if (query.isFeatured === 'true') {
    filters.isFeatured = true;
  }
  
  // Sale products
  if (query.isOnSale === 'true') {
    filters.isOnSale = true;
  }
  
  // Tags filter
  if (query.tags) {
    const tags = Array.isArray(query.tags) 
      ? query.tags 
      : query.tags.split(',').map(t => t.trim());
    
    if (tags.length > 0) {
      filters.tags = { $in: tags };
    }
  }
  
  return filters;
};

/**
 * Build sort object for product queries
 */
export const buildSortOptions = (query = {}) => {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = query;
  
  const validSortFields = [
    'name', 'price', 'averageRating', 'createdAt', 
    'weight', 'totalReviews', 'discountPrice'
  ];
  
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  
  return { [sortField]: sortDirection };
};

/**
 * Build search query for text search
 */
export const buildSearchQuery = (searchTerm, additionalFilters = {}) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return additionalFilters;
  }
  
  const trimmedTerm = searchTerm.trim();
  if (trimmedTerm.length < 2) {
    return additionalFilters;
  }
  
  return {
    $and: [
      additionalFilters,
      {
        $or: [
          { name: { $regex: trimmedTerm, $options: "i" } },
          { description: { $regex: trimmedTerm, $options: "i" } },
          { tags: { $in: [new RegExp(trimmedTerm, 'i')] } },
          { ingredients: { $in: [new RegExp(trimmedTerm, 'i')] } }
        ]
      }
    ]
  };
};

/**
 * Format pagination response
 */
export const formatPaginationResponse = (total, page, limit, additionalData = {}) => {
  return {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      ...additionalData
    }
  };
};

/**
 * Apply product transformations
 */
export const transformProducts = (products) => {
  return products.map(p => ({
    ...p,
    category: p.category_id?.name || null,
    category_id: p.category_id?._id || p.category_id,
    // Add computed fields
    finalPrice: p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price,
    discount: p.discountPrice && p.discountPrice < p.price 
      ? Math.round(((p.price - p.discountPrice) / p.price) * 100) 
      : 0
  }));
};

/**
 * Validate filter parameters
 */
export const validateFilters = (query) => {
  const errors = [];
  
  // Validate price range
  if (query.minPrice && query.maxPrice) {
    const minPrice = parseFloat(query.minPrice);
    const maxPrice = parseFloat(query.maxPrice);
    
    if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
      errors.push('Giá tối thiểu không thể lớn hơn giá tối đa');
    }
  }
  
  // Validate weight range
  if (query.minWeight && query.maxWeight) {
    const minWeight = parseFloat(query.minWeight);
    const maxWeight = parseFloat(query.maxWeight);
    
    if (!isNaN(minWeight) && !isNaN(maxWeight) && minWeight > maxWeight) {
      errors.push('Trọng lượng tối thiểu không thể lớn hơn trọng lượng tối đa');
    }
  }
  
  // Validate rating
  if (query.minRating) {
    const minRating = parseFloat(query.minRating);
    if (!isNaN(minRating) && (minRating < 0 || minRating > 5)) {
      errors.push('Đánh giá tối thiểu phải từ 0 đến 5');
    }
  }
  
  return errors;
};
