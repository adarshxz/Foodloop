const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'foodloop.db');
const db = new sqlite3.Database(dbPath);

const initialFoodListings = [
    {
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
        image: "🍛",
        lat: 22.7196,
        lng: 75.8577,
        listedAt: new Date().toISOString()
    },
    {
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
        image: "🥘",
        lat: 22.7210,
        lng: 75.8590,
        listedAt: new Date().toISOString()
    }
];

db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO listings (
        name, type, quantity, description, bestBefore, condition,
        location, lat, lng, donor, organization, image, distance, listedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    initialFoodListings.forEach(food => {
        stmt.run(
            food.name, food.type, food.quantity, food.description,
            food.bestBefore, food.condition, food.location,
            food.lat, food.lng, food.donor, food.organization,
            food.image, food.distance, food.listedAt
        );
    });

    stmt.finalize();
    console.log('Database seeded with initial listings.');
});

db.close();
