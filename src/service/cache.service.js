import NodeCache from "node-cache";
import productModel from "../models/product.model.js";
import categoryModel from "../models/category.model.js";

class CacheService {
  constructor() {
    // Cache cho categories (5 phút)
    this.categoryCache = new NodeCache({ 
      stdTTL: 300, // 5 minutes
      checkperiod: 60 // Check expired keys every 60 seconds
    });

    // Cache cho featured products (2 phút)
    this.featuredCache = new NodeCache({ 
      stdTTL: 120, // 2 minutes
      checkperiod: 30
    });

    // Cache cho sale products (2 phút)
    this.saleCache = new NodeCache({ 
      stdTTL: 120, // 2 minutes
      checkperiod: 30
    });

    // Cache cho new products (3 phút)
    this.newCache = new NodeCache({ 
      stdTTL: 180, // 3 minutes
      checkperiod: 60
    });

    // Cache cho product details (1 phút)
    this.productCache = new NodeCache({ 
      stdTTL: 60, // 1 minute
      checkperiod: 30
    });
  }

  /**
   * Lấy categories với cache
   */
  async getCategories() {
    const cacheKey = 'categories';
    let categories = this.categoryCache.get(cacheKey);

    if (!categories) {
      categories = await categoryModel
        .find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .lean();
      
      this.categoryCache.set(cacheKey, categories);
      console.log('Categories cached');
    }

    return categories;
  }

  /**
   * Xóa cache categories khi có thay đổi
   */
  clearCategoriesCache() {
    this.categoryCache.del('categories');
    console.log('Categories cache cleared');
  }

  /**
   * Lấy featured products với cache
   */
  async getFeaturedProducts(limit = 10) {
    const cacheKey = `featured_${limit}`;
    let products = this.featuredCache.get(cacheKey);

    if (!products) {
      products = await productModel
        .find({ isFeatured: true, isAvailable: true })
        .select('name description price discountPrice imgUrl isOnSale averageRating totalReviews category_id weight size')
        .populate('category_id', 'name')
        .sort({ displayOrder: -1, createdAt: -1 })
        .limit(limit)
        .lean();
      
      this.featuredCache.set(cacheKey, products);
      console.log(`Featured products (${limit}) cached`);
    }

    return products;
  }

  /**
   * Lấy sale products với cache
   */
  async getSaleProducts(limit = 10) {
    const cacheKey = `sale_${limit}`;
    let products = this.saleCache.get(cacheKey);

    if (!products) {
      products = await productModel
        .find({ isOnSale: true, isAvailable: true })
        .select('name description price discountPrice imgUrl averageRating totalReviews category_id weight size')
        .populate('category_id', 'name')
        .sort({ discountPrice: 1, createdAt: -1 })
        .limit(limit)
        .lean();
      
      this.saleCache.set(cacheKey, products);
      console.log(`Sale products (${limit}) cached`);
    }

    return products;
  }

  /**
   * Lấy new products với cache
   */
  async getNewProducts(limit = 10) {
    const cacheKey = `new_${limit}`;
    let products = this.newCache.get(cacheKey);

    if (!products) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      products = await productModel
        .find({ 
          createdAt: { $gte: sevenDaysAgo },
          isAvailable: true 
        })
        .select('name description price discountPrice imgUrl averageRating totalReviews category_id weight size')
        .populate('category_id', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      
      this.newCache.set(cacheKey, products);
      console.log(`New products (${limit}) cached`);
    }

    return products;
  }

  /**
   * Lấy product detail với cache
   */
  async getProductById(productId) {
    const cacheKey = `product_${productId}`;
    let product = this.productCache.get(cacheKey);

    if (!product) {
      product = await productModel
        .findById(productId)
        .populate('category_id', 'name')
        .lean();
      
      if (product) {
        this.productCache.set(cacheKey, product);
        console.log(`Product ${productId} cached`);
      }
    }

    return product;
  }

  /**
   * Xóa cache của một sản phẩm cụ thể
   */
  clearProductCache(productId) {
    this.productCache.del(`product_${productId}`);
    console.log(`Product ${productId} cache cleared`);
  }

  /**
   * Xóa tất cả cache liên quan đến products
   */
  clearAllProductCaches() {
    this.featuredCache.flushAll();
    this.saleCache.flushAll();
    this.newCache.flushAll();
    this.productCache.flushAll();
    console.log('All product caches cleared');
  }

  /**
   * Lấy cache statistics
   */
  getCacheStats() {
    return {
      categories: {
        keys: this.categoryCache.keys().length,
        stats: this.categoryCache.getStats()
      },
      featured: {
        keys: this.featuredCache.keys().length,
        stats: this.featuredCache.getStats()
      },
      sale: {
        keys: this.saleCache.keys().length,
        stats: this.saleCache.getStats()
      },
      new: {
        keys: this.newCache.keys().length,
        stats: this.newCache.getStats()
      },
      product: {
        keys: this.productCache.keys().length,
        stats: this.productCache.getStats()
      }
    };
  }

  /**
   * Xóa tất cả cache
   */
  flushAll() {
    this.categoryCache.flushAll();
    this.featuredCache.flushAll();
    this.saleCache.flushAll();
    this.newCache.flushAll();
    this.productCache.flushAll();
    console.log('All caches flushed');
  }

  /**
   * Warm up cache - preload commonly accessed data
   */
  async warmUpCache() {
    try {
      console.log('Warming up cache...');
      
      // Preload categories
      await this.getCategories();
      
      // Preload featured products
      await this.getFeaturedProducts(10);
      
      // Preload sale products
      await this.getSaleProducts(10);
      
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;
