
require("dotenv").config();

// Fix Node.js DNS resolution for MongoDB Atlas SRV
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");
const User = require("../models/User");

const recipes = [
  {
    title: "Masala Dosa",
    description: "Crispy South Indian dosa stuffed with spicy potato masala, served with coconut chutney and sambar.",
    ingredients: [
      { name: "Dosa batter", quantity: "2 cups" },
      { name: "Potatoes", quantity: "3 medium" },
      { name: "Onion", quantity: "1 sliced" },
      { name: "Mustard seeds", quantity: "1 teaspoon" },
      { name: "Curry leaves", quantity: "8-10" }
    ],
    steps: [
      "Boil and mash the potatoes.",
      "Heat oil and add mustard seeds, curry leaves and onions.",
      "Add potatoes, salt and spices. Cook the masala.",
      "Spread dosa batter on a hot pan.",
      "Add potato masala and fold the dosa.",
      "Serve hot with chutney and sambar."
    ],
    category: "indian",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976",
    cookingTime: 35,
    servings: 2
  },
  {
    title: "Chole Bhature",
    description: "Popular North Indian dish featuring spicy chickpea curry served with fluffy fried bread.",
    ingredients: [
      { name: "Chickpeas", quantity: "2 cups soaked" },
      { name: "Onions", quantity: "2" },
      { name: "Tomatoes", quantity: "3" },
      { name: "Chole masala", quantity: "2 tablespoons" },
      { name: "Flour", quantity: "2 cups" },
      { name: "Curd", quantity: "1/2 cup" }
    ],
    steps: [
      "Pressure cook soaked chickpeas until soft.",
      "Prepare a gravy using onions, tomatoes and spices.",
      "Add chickpeas and simmer the curry.",
      "Prepare bhatura dough using flour and curd.",
      "Rest the dough and roll into round shapes.",
      "Deep fry until golden and serve with chole."
    ],
    category: "indian",
    imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027",
    cookingTime: 45,
    servings: 3
  },
  {
    title: "White Sauce Pasta",
    description: "Creamy Italian-style pasta prepared with milk, butter, cheese and herbs.",
    ingredients: [
      { name: "Pasta", quantity: "200 grams" },
      { name: "Milk", quantity: "2 cups" },
      { name: "Butter", quantity: "2 tablespoons" },
      { name: "All-purpose flour", quantity: "2 tablespoons" },
      { name: "Cheese", quantity: "1/2 cup" },
      { name: "Mixed herbs", quantity: "1 teaspoon" }
    ],
    steps: [
      "Boil pasta in salted water until cooked.",
      "Melt butter in a pan.",
      "Add flour and cook for one minute.",
      "Gradually add milk while stirring.",
      "Add cheese, herbs, salt and pepper.",
      "Mix pasta into the sauce and serve."
    ],
    category: "italian",
    imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
    cookingTime: 25,
    servings: 2
  },
  {
    title: "Margherita Pizza",
    description: "Classic Italian pizza topped with tomato sauce, mozzarella cheese and fresh basil.",
    ingredients: [
      { name: "Pizza base", quantity: "1 large" },
      { name: "Pizza sauce", quantity: "1/2 cup" },
      { name: "Mozzarella cheese", quantity: "150 grams" },
      { name: "Basil leaves", quantity: "8-10" },
      { name: "Olive oil", quantity: "1 tablespoon" }
    ],
    steps: [
      "Preheat the oven to 220°C.",
      "Spread pizza sauce over the pizza base.",
      "Add mozzarella cheese.",
      "Place fresh basil leaves on top.",
      "Bake until the crust is golden and cheese melts.",
      "Slice and serve hot."
    ],
    category: "italian",
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    cookingTime: 30,
    servings: 2
  },
  {
    title: "Veg Hakka Noodles",
    description: "Popular Indo-Chinese noodles tossed with crunchy vegetables and flavorful sauces.",
    ingredients: [
      { name: "Hakka noodles", quantity: "200 grams" },
      { name: "Capsicum", quantity: "1 sliced" },
      { name: "Carrot", quantity: "1 sliced" },
      { name: "Cabbage", quantity: "1 cup shredded" },
      { name: "Soy sauce", quantity: "1 tablespoon" },
      { name: "Vinegar", quantity: "1 teaspoon" }
    ],
    steps: [
      "Boil noodles according to package instructions.",
      "Drain and toss with a little oil.",
      "Heat oil in a wok.",
      "Stir-fry vegetables on high heat.",
      "Add noodles, soy sauce and vinegar.",
      "Toss well and serve hot."
    ],
    category: "chinese",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246",
    cookingTime: 20,
    servings: 2
  },
  {
    title: "Vegetable Spring Rolls",
    description: "Crispy rolls filled with seasoned vegetables, perfect as an evening snack.",
    ingredients: [
      { name: "Spring roll sheets", quantity: "8" },
      { name: "Cabbage", quantity: "1 cup" },
      { name: "Carrot", quantity: "1" },
      { name: "Capsicum", quantity: "1" },
      { name: "Soy sauce", quantity: "1 tablespoon" },
      { name: "Corn flour", quantity: "2 tablespoons" }
    ],
    steps: [
      "Finely chop all vegetables.",
      "Stir-fry vegetables with soy sauce.",
      "Allow the filling to cool.",
      "Place filling on a spring roll sheet.",
      "Fold and seal using corn flour paste.",
      "Deep fry until crispy and golden."
    ],
    category: "chinese",
    imageUrl: "https://images.unsplash.com/photo-1606335543042-57c525922933",
    cookingTime: 25,
    servings: 4
  },
  {
    title: "Aloo Tikki",
    description: "Golden and crispy potato patties seasoned with Indian spices.",
    ingredients: [
      { name: "Potatoes", quantity: "4 boiled" },
      { name: "Green chillies", quantity: "2 chopped" },
      { name: "Coriander leaves", quantity: "2 tablespoons" },
      { name: "Corn flour", quantity: "2 tablespoons" },
      { name: "Garam masala", quantity: "1 teaspoon" }
    ],
    steps: [
      "Peel and mash boiled potatoes.",
      "Add chillies, coriander and spices.",
      "Mix in corn flour.",
      "Shape the mixture into small patties.",
      "Shallow fry until both sides are golden.",
      "Serve with green and tamarind chutney."
    ],
    category: "snacks",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    cookingTime: 25,
    servings: 3
  },
  {
    title: "Paneer Tikka",
    description: "Grilled paneer cubes marinated in yogurt and aromatic Indian spices.",
    ingredients: [
      { name: "Paneer", quantity: "250 grams" },
      { name: "Curd", quantity: "1/2 cup" },
      { name: "Capsicum", quantity: "1" },
      { name: "Onion", quantity: "1" },
      { name: "Tandoori masala", quantity: "2 teaspoons" },
      { name: "Lemon juice", quantity: "1 tablespoon" }
    ],
    steps: [
      "Cut paneer and vegetables into cubes.",
      "Mix curd with spices and lemon juice.",
      "Add paneer and vegetables to the marinade.",
      "Rest for 30 minutes.",
      "Arrange on skewers.",
      "Grill or pan-fry until lightly charred."
    ],
    category: "snacks",
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8",
    cookingTime: 35,
    servings: 3
  },
  {
    title: "Red Velvet Cake",
    description: "Soft and moist red velvet cake layered with smooth cream cheese frosting.",
    ingredients: [
      { name: "All-purpose flour", quantity: "2 cups" },
      { name: "Sugar", quantity: "1 cup" },
      { name: "Cocoa powder", quantity: "2 tablespoons" },
      { name: "Milk", quantity: "1 cup" },
      { name: "Butter", quantity: "100 grams" },
      { name: "Red food color", quantity: "As required" }
    ],
    steps: [
      "Preheat the oven to 180°C.",
      "Mix flour, cocoa powder and baking powder.",
      "Cream butter and sugar together.",
      "Add milk and red food color.",
      "Combine wet and dry ingredients.",
      "Bake until a toothpick comes out clean.",
      "Cool and decorate with frosting."
    ],
    category: "dessert",
    imageUrl: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f",
    cookingTime: 50,
    servings: 6
  },
  {
    title: "Chocolate Brownie",
    description: "Rich and fudgy chocolate brownies with a soft centre and a delicious chocolate flavour.",
    ingredients: [
      { name: "Dark chocolate", quantity: "150 grams" },
      { name: "Butter", quantity: "100 grams" },
      { name: "Sugar", quantity: "3/4 cup" },
      { name: "All-purpose flour", quantity: "1/2 cup" },
      { name: "Cocoa powder", quantity: "2 tablespoons" },
      { name: "Vanilla essence", quantity: "1 teaspoon" }
    ],
    steps: [
      "Preheat the oven to 180°C.",
      "Melt chocolate and butter together.",
      "Mix in sugar and vanilla essence.",
      "Add flour and cocoa powder.",
      "Pour the batter into a lined baking tray.",
      "Bake for around 25 minutes.",
      "Cool, cut into squares and serve."
    ],
    category: "dessert",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
    cookingTime: 35,
    servings: 6
  }
];

const seedRecipes = async () => {
  let connected = false;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    connected = true;
    console.log("MongoDB connected successfully");

    const user = await User.findOne();

    if (!user) {
      throw new Error("No registered user found. Please register first.");
    }

    console.log("Using user:", user.name || user.email || user._id);

    let added = 0;
    let skipped = 0;

    for (const recipeData of recipes) {
      const alreadyExists = await Recipe.findOne({
        title: recipeData.title,
        category: recipeData.category
      });

      if (alreadyExists) {
        console.log("Skipped existing recipe:", recipeData.title);
        skipped++;
        continue;
      }

      await Recipe.create({
        ...recipeData,
        createdBy: user._id
      });

      console.log("Added:", recipeData.title);
      added++;
    }

    console.log("\nSeed completed!");
    console.log("Added:", added);
    console.log("Skipped:", skipped);
    console.log("Total sample recipes:", recipes.length);

  } catch (error) {
    console.error("\nSeed error:", error.message);

    if (error.code === "ECONNREFUSED" || error.syscall === "querySrv") {
      console.log("\nDNS troubleshooting:");
      console.log("Node.js DNS servers:", dns.getServers());
      console.log("Try running the Node.js SRV test with dns.setServers().");
    }

    process.exitCode = 1;

  } finally {
    if (connected) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  }
};

seedRecipes();
