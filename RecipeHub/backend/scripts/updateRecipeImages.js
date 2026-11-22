
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");

const imageUpdates = [
  {
    title: "Vegetable Spring Rolls",
    category: "chinese",
    imageUrl:
      "https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/veg_spring_rolls.jpg",
  },
  {
    title: "Aloo Tikki",
    category: "snacks",
    imageUrl:
      "https://www.spicepots.com/cdn/shop/articles/Shopify_2048_x_2048_1080x.jpg?v=1678875969",
  },
  {
    title: "White Sauce Pasta",
    category: "italian",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/35/Creamy_white_sauce_penne_pasta.jpg",
  },
  {
    title: "Chole Bhature",
    category: "indian",
    imageUrl:
      "https://dtwaeonhht2im.cloudfront.net/2f815f0942360f9b443acca4f7f3ded1.jpg",
  },
  {
    title: "Chocolate Cake",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/ChocolateCake.jpg",
  },
  {
    title: "Veg Fried Rice",
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Vegetable%20fried%20rice.jpg",
  },
];

async function updateRecipeImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");

    for (const item of imageUpdates) {
      const filter = {
        title: { $regex: `^${item.title}$`, $options: "i" },
      };

      // Category filter only when category is provided
      if (item.category) {
        filter.category = item.category;
      }

      const result = await Recipe.updateOne(filter, {
        $set: {
          imageUrl: item.imageUrl,
        },
      });

      if (result.matchedCount > 0) {
        console.log("Image updated:", item.title);
      } else {
        console.log("Recipe not found:", item.title);
      }
    }

    console.log("\nImage update process completed!");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB Disconnected");
    }
  }
}

updateRecipeImages();
