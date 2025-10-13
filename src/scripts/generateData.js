import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

import productModel from "../models/product.model.js";
import categoryModel from "../models/category.model.js";
import userModel from "../models/user.model.js";

const outputJsonPath = "./src/data/data.json";
const outputCategoriesJsonPath = "./src/data/data.categories.json";
const outputUsersJsonPath = "./src/data/users.json";


const importCategory = async (req, res) => {
  try {
    const data = fs.readFileSync(outputCategoriesJsonPath, "utf-8");
    const categories = JSON.parse(data);

    const category = categories.map((item) => ({
      name: item,
    }));

    await categoryModel.deleteMany();
    await categoryModel.insertMany(category);

    if (res) {
      res.status(201).json({
        success: true,
        message: "Categories imported successfully",
        data: category,
      });
    } 
 
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error(error);
    }
  }
};
const importProduct = async (req, res) => {
  try {
    const data = fs.readFileSync(outputJsonPath, "utf-8");
    const products = JSON.parse(data);

    // lấy dữ liệu thể loại từ database sau đó thêm id
    const categories = await categoryModel.find();

    if (categories.length === 0) {
      res.status(404).json({ error: "Categories not found" });
      return;
    }

    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category._id;
      return map;
    }, {});

    const productsWithCategory = products.map((item) => ({
      name: item["Tên sản phẩm"],
      price: item[" Giá "],
      category_id: categoryMap[item["Thể loại"]],
      description: item["Mô tả"],
      imgUrl: item.imgUrl,
    }));

    await productModel.deleteMany();
    await productModel.insertMany(productsWithCategory);

    if (res) {
      res.status(201).json({
        success: true,
        message: "Products imported successfully",
        data: productsWithCategory,
      });
    } 
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error(error);
    }
  }
};

const importUser = async (req, res) => {
  try {
  
    const data = fs.readFileSync(outputUsersJsonPath, "utf-8");
    const users = JSON.parse(data);

    // Mã hóa mật khẩu
    const saltRounds = 10;
    users.forEach((user) => {
      user.password = bcrypt.hashSync(user.password, saltRounds);
    });

    await userModel.deleteMany();
    await userModel.insertMany(users);
    if (res) {
      res.status(201).json({
        success: true,
        message: "Users imported successfully",
        data: users,
      });
    } else {
      console.log(`Đã import ${users.length} user vào database.`);
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ error: error.message });
    } else {
      console.error(error);
    }
  }
};


export { importProduct, importCategory, importUser };
