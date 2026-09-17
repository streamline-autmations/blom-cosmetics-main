// Test cases
var testProducts = [
    // Case 1: Product with all fields populated
    {
        name: "Full Product",
        description: "This is a full product description",
        howToUse: ["Step 1", "Step 2"],
        ingredients: {
            inci: ["Ingredient 1", "Ingredient 2"]
        }
    },
    // Case 2: Product with only description
    {
        name: "Description Only",
        description: "Only description available",
        howToUse: [],
        ingredients: {
            inci: []
        }
    },
    // Case 3: Product with empty description
    {
        name: "No Description",
        description: "",
        howToUse: ["Step 1"],
        ingredients: {
            inci: ["Ingredient 1"]
        }
    },
    // Case 4: Product with string ingredients (edge case)
    {
        name: "String Ingredients",
        description: "Product with string ingredients",
        howToUse: ["Use as directed"],
        ingredients: {
            inci: "Ingredient1, Ingredient2, Ingredient3"
        }
    }
];
function testContentChecks(product) {
    var _a;
    // 1. Check if we have a description
    var hasDescription = product.description && product.description.trim().length > 0;
    // 2. Check if we have ingredients (Safety Fix Included)
    var rawIngredients = (_a = product.ingredients) === null || _a === void 0 ? void 0 : _a.inci;
    var safeIngredients = [];
    if (Array.isArray(rawIngredients)) {
        safeIngredients = rawIngredients;
    }
    else if (typeof rawIngredients === 'string') {
        safeIngredients = rawIngredients.split(',').map(function (i) { return i.trim(); }).filter(function (i) { return i; });
    }
    var hasIngredients = safeIngredients.length > 0;
    // 3. Check other sections
    var hasHowToUse = product.howToUse && product.howToUse.length > 0;
    // 4. Master Switch: Do we show the Product Information section at all?
    var showProductInfoSection = hasDescription || hasIngredients || hasHowToUse;
    console.log("Product: ".concat(product.name));
    console.log("  Has Description: ".concat(hasDescription));
    console.log("  Has Ingredients: ".concat(hasIngredients));
    console.log("  Has How To Use: ".concat(hasHowToUse));
    console.log("  Show Product Info Section: ".concat(showProductInfoSection));
    console.log("  Safe Ingredients:", safeIngredients);
    console.log('---');
}
// Run tests
testProducts.forEach(testContentChecks);
