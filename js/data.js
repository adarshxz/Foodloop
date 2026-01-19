// Sample food data (In production, this would come from your backend/database)
let availableFoodListings = [
    {
        id: 1,
        name: "Vegetable Biryani & Raita",
        type: "vegetarian",
        quantity: "25 plates",
        description: "Freshly prepared biryani from college fest. Includes raita and salad.",
        distance: 0.3,
        location: "Main Campus Hostel - Block A",
        bestBefore: "Today, 8:00 PM",
        condition: "Freshly Prepared",
        donor: "Student Council",
        organization: "Annual College Fest",
        image: "🍛"
    },
    {
        id: 2,
        name: "Paneer Tikka & Naan",
        type: "vegetarian",
        quantity: "15 servings",
        description: "Wedding leftover. High quality paneer tikka with butter naan.",
        distance: 0.5,
        location: "Green Valley Banquet Hall",
        bestBefore: "Today, 9:00 PM",
        condition: "Few Hours Old",
        donor: "Sharma Family",
        organization: "Wedding Event",
        image: "🥘"
    },
    {
        id: 3,
        name: "Chicken Curry & Rice",
        type: "non-vegetarian",
        quantity: "20 plates",
        description: "Delicious chicken curry with steamed rice. Mild spice level.",
        distance: 0.8,
        location: "Campus Canteen - North Wing",
        bestBefore: "Today, 7:30 PM",
        condition: "Freshly Prepared",
        donor: "Campus Canteen",
        organization: "Daily Operations",
        image: "🍗"
    },
    {
        id: 4,
        name: "Mixed Veg Pulao & Dal",
        type: "vegan",
        quantity: "30 plates",
        description: "Healthy vegan meal with mixed vegetable pulao and yellow dal.",
        distance: 1.2,
        location: "Girls Hostel Mess",
        bestBefore: "Today, 8:30 PM",
        condition: "Freshly Prepared",
        donor: "Hostel Committee",
        organization: "Hostel Mess",
        image: "🥗"
    },
    {
        id: 5,
        name: "Pizza Slices & Garlic Bread",
        type: "vegetarian",
        quantity: "40 slices",
        description: "Margherita and veggie supreme pizza with garlic bread sticks.",
        distance: 1.5,
        location: "Tech Park Cafeteria",
        bestBefore: "Today, 7:00 PM",
        condition: "Few Hours Old",
        donor: "Tech Company Event",
        organization: "Product Launch Event",
        image: "🍕"
    },
    {
        id: 6,
        name: "Chole Bhature",
        type: "vegetarian",
        quantity: "18 servings",
        description: "Authentic North Indian chole bhature with pickle and onions.",
        distance: 2.0,
        location: "Community Center - Sector 7",
        bestBefore: "Today, 8:00 PM",
        condition: "Freshly Prepared",
        donor: "Community Kitchen",
        organization: "Religious Gathering",
        image: "🫓"
    },
    {
        id: 7,
        name: "Fruit Salad & Sandwiches",
        type: "vegan",
        quantity: "25 portions",
        description: "Fresh fruit salad and vegetable sandwiches. Perfect for light meal.",
        distance: 2.3,
        location: "Sports Complex",
        bestBefore: "Today, 6:30 PM",
        condition: "Freshly Prepared",
        donor: "Sports Event Team",
        organization: "Marathon Event",
        image: "🥪"
    }
];

let currentFilter = 'all';

// Authentication State
let currentUser = null;
let selectedUserType = null;
let isLoginMode = true;

// Map variables
let findMap = null;
let donationMap = null;
let donationMarker = null;
let userLocation = null;
const DEFAULT_LOCATION = [22.7196, 75.8577]; // Indore, India
let mapMarkers = [];
