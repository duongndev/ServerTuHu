import productModel from "../models/product.model.js";
import cartModel from "../models/cart.model.js";
import { standardResponse } from "../utils/utility.function.js";
import userModel from "../models/user.model.js";

// Helper: Định dạng chi tiết sản phẩm trong giỏ hàng
function formatCartItems(items) {
  return items.map((item) => {
    const product = item.product_id;
    const actualPrice = product.isOnSale && product.discountPrice > 0 
      ? product.discountPrice 
      : product.price;
    
    return {
      product_id: product._id,
      product_name: product.name,
      product_image: product.imgUrl,
      product_price: product.price,
      product_discount_price: product.discountPrice || null,
      product_actual_price: actualPrice,
      isOnSale: product.isOnSale || false,
      product_quantity: item.quantity,
    };
  });
}

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;
  try {
    // Kiểm tra sản phẩm tồn tại
    const product = await productModel.findById(product_id);
    if (!product) {
      return standardResponse(res, 404, {
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    // Kiểm tra sản phẩm có còn khả dụng không
    if (!product.isAvailable) {
      return standardResponse(res, 400, {
        success: false,
        message: "Sản phẩm hiện không khả dụng",
      });
    }

    // Tính giá thực tế (có xét đến giảm giá)
    const actualPrice = product.isOnSale && product.discountPrice > 0 
      ? product.discountPrice 
      : product.price;

    // Tìm hoặc tạo mới giỏ hàng
    let cart = await cartModel.findOne({ user_id });
    if (!cart) {
      cart = new cartModel({
        user_id: user_id,
        items: [{ product_id, quantity, price: actualPrice * quantity }],
        totalPrice: actualPrice * quantity,
      });
    } else {
      const cartItem = cart.items.find(
        (item) => item.product_id.toString() === product_id
      );
      if (cartItem) {
        // Cập nhật số lượng và giá của item (sử dụng giá hiện tại)
        cartItem.quantity += quantity;
        cartItem.price = actualPrice * cartItem.quantity;
      } else {
        // Thêm item mới
        cart.items.push({
          product_id,
          quantity,
          price: actualPrice * quantity
        });
      }
      // Tính lại tổng tiền
      cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    }
    await cart.save();
    
    // Lấy lại giỏ hàng đã populate với thông tin đầy đủ
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ 
        path: "items.product_id", 
        select: "name imgUrl price discountPrice isOnSale" 
      });
    const detailedProducts = formatCartItems(updatedCart.items);
    
    return standardResponse(res, 200, {
      success: true,
      message: "Sản phẩm đã được thêm vào giỏ hàng",
      data: {
        user_id,
        cart: detailedProducts,
        totalPrice: updatedCart.totalPrice,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
  }
};

// Lấy giỏ hàng của người dùng
const getUserCart = async (req, res) => {
  const user_id = req.user.id;
  try {
    const user = await userModel.findById(user_id);
    if (!user)
      return standardResponse(res, 404, {
        success: false,
        message: "Người dùng không tồn tại",
      });
    const cart = await cartModel
      .findOne({ user_id })
      .populate({ 
        path: "items.product_id", 
        select: "name imgUrl price discountPrice isOnSale" 
      });
    if (!cart)
      return standardResponse(res, 404, {
        success: false,
        message: "Giỏ hàng trống",
        data: { user_id, cart: [], totalPrice: 0 },
      });
    const detailedProducts = formatCartItems(cart.items);
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy giỏ hàng thành công",
      data: { user_id, cart: detailedProducts, totalPrice: cart.totalPrice },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." + error.message });
  }
};

// Tăng số lượng sản phẩm trong giỏ hàng
const increaseQuantity = async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;
  try {
    const user = await userModel.findById(user_id);
    if (!user)
      return standardResponse(res, 404, {
        success: false,
        message: "Người dùng không tồn tại",
      });
    const cart = await cartModel.findOne({ user_id });
    if (!cart)
      return standardResponse(res, 404, {
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    const cartItem = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );
    if (!cartItem)
      return standardResponse(res, 404, {
        success: false,
        message: "Sản phẩm không tồn tại trong giỏ hàng",
      });
    const product = await productModel.findById(product_id);
    if (!product)
      return standardResponse(res, 404, {
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    
    // Tính giá thực tế (có xét đến giảm giá)
    const actualPrice = product.isOnSale && product.discountPrice > 0 
      ? product.discountPrice 
      : product.price;
    
    cartItem.quantity += 1;
    cartItem.price = actualPrice * cartItem.quantity;
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    await cart.save();
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ 
        path: "items.product_id", 
        select: "name imgUrl price discountPrice isOnSale" 
      });
    const detailedProducts = formatCartItems(updatedCart.items);
    return standardResponse(res, 200, {
      success: true,
      message: "Số lượng sản phẩm đã được tăng",
      data: {
        user_id,
        cart: detailedProducts,
        totalPrice: updatedCart.totalPrice,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
  }
};

// Giảm số lượng sản phẩm trong giỏ hàng
const decreaseQuantity = async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;
  try {
    const user = await userModel.findById(user_id);
    if (!user)
      return standardResponse(res, 404, {
        success: false,
        message: "Người dùng không tồn tại",
      });
    const cart = await cartModel.findOne({ user_id });
    if (!cart)
      return standardResponse(res, 404, {
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    const cartItem = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );
    if (!cartItem)
      return standardResponse(res, 404, {
        success: false,
        message: "Sản phẩm không tồn tại trong giỏ hàng",
      });
    const product = await productModel.findById(product_id);
    if (!product)
      return standardResponse(res, 404, {
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    
    // Tính giá thực tế (có xét đến giảm giá)
    const actualPrice = product.isOnSale && product.discountPrice > 0 
      ? product.discountPrice 
      : product.price;
    
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      cartItem.price = actualPrice * cartItem.quantity;
    } else {
      cart.items = cart.items.filter(
        (item) => item.product_id.toString() !== product_id
      );
    }
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    await cart.save();
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ 
        path: "items.product_id", 
        select: "name imgUrl price discountPrice isOnSale" 
      });
    const detailedProducts = formatCartItems(updatedCart.items);
    return standardResponse(res, 200, {
      success: true,
      message: "Số lượng sản phẩm đã được giảm",
      data: {
        user_id,
        cart: detailedProducts,
        totalPrice: updatedCart.totalPrice,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;
  try {
    const user = await userModel.findById(user_id);
    if (!user)
      return standardResponse(res, 404, {
        success: false,
        message: "Người dùng không tồn tại",
      });
    const cart = await cartModel.findOne({ user_id });
    if (!cart)
      return standardResponse(res, 404, {
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    const cartItem = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );
    if (!cartItem)
      return standardResponse(res, 404, {
        success: false,
        message: "Sản phẩm không tồn tại trong giỏ hàng",
      });
    cart.totalPrice -= cartItem.price * cartItem.quantity;
    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== product_id
    );
    await cart.save();
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ 
        path: "items.product_id", 
        select: "name imgUrl price discountPrice isOnSale" 
      });
    const detailedProducts = formatCartItems(updatedCart.items);
    return standardResponse(res, 200, {
      success: true,
      message: "Sản phẩm được xóa trong giỏ hàng",
      data: {
        user_id,
        cart: detailedProducts,
        totalPrice: updatedCart.totalPrice,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
  }
};

// get count item in cart
const getCountItemInCart = async (req, res) => {
  const user_id = req.user.id;
  try {
    const cart = await cartModel.findOne({ user_id });
    if (!cart)
      return standardResponse(res, 404, {
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy số lượng sản phẩm trong giỏ hàng thành công",
      data: {
        count: cart.items.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
  }
};


export {
  addToCart,
  getUserCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  getCountItemInCart
};
