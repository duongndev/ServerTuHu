const productModel = require("../models/product.model");
const cartModel = require("../models/cart.model");
const { standardResponse } = require("../utils/utility.function");
const userModel = require("../models/user.model");

// Helper: Định dạng chi tiết sản phẩm trong giỏ hàng
function formatCartItems(items) {
  return items.map((item) => ({
    product_id: item.product_id._id,
    product_name: item.product_id.name,
    product_image: item.product_id.imgUrl,
    product_price: item.product_id.price,
    product_quantity: item.quantity,
  }));
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
    // Tìm hoặc tạo mới giỏ hàng
    let cart = await cartModel.findOne({ user_id });
    if (!cart) {
      cart = new cartModel({
        user_id: user_id,
        items: [{ product_id, quantity, price: product.price * quantity }],
        totalPrice: product.price * quantity,
      });
    } else {
      const cartItem = cart.items.find(
        (item) => item.product_id.toString() === product_id
      );
      if (cartItem) {
        // Cập nhật số lượng và giá của item
        cartItem.quantity += quantity;
        cartItem.price = product.price * cartItem.quantity;
      } else {
        // Thêm item mới
        cart.items.push({
          product_id,
          quantity,
          price: product.price * quantity
        });
      }
      // Tính lại tổng tiền
      cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    }
    await cart.save();
    // Lấy lại giỏ hàng đã populate
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ path: "items.product_id", select: "name imgUrl price" });
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
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi thêm sản phẩm vào giỏ hàng",
      error: error.message,
    });
    
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
      .populate({ path: "items.product_id", select: "name imgUrl price" });
    if (!cart)
      return standardResponse(res, 404, {
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    const detailedProducts = formatCartItems(cart.items);
    return standardResponse(res, 200, {
      success: true,
      message: "Lấy giỏ hàng thành công",
      data: { user_id, cart: detailedProducts, totalPrice: cart.totalPrice },
    });
  } catch (error) {
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi lấy giỏ hàng",
      error: error.message,
    });
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
    cartItem.quantity += 1;
    cartItem.price = product.price * cartItem.quantity;
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    await cart.save();
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ path: "items.product_id", select: "name imgUrl price" });
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
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi tăng số lượng sản phẩm",
      error: error.message,
    });
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
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      cartItem.price = product.price * cartItem.quantity;
    } else {
      cart.items = cart.items.filter(
        (item) => item.product_id.toString() !== product_id
      );
    }
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    await cart.save();
    const updatedCart = await cartModel
      .findOne({ user_id })
      .populate({ path: "items.product_id", select: "name imgUrl price" });
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
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi giảm số lượng trong sản phẩm",
      error: error.message,
    });
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
      .populate({ path: "items.product_id", select: "name imgUrl price" });
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
    return standardResponse(res, 500, {
      success: false,
      message: "Lỗi khi xóa sản phẩm trong giỏ hàng",
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getUserCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
};
