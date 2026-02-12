const API_URL = 'http://localhost:3000/api';
let availableFoodListings = [];
let allReservations = [];

async function fetchListings() {
    try {
        const response = await fetch(`${API_URL}/listings`);
        const data = await response.json();
        availableFoodListings = data;
        return availableFoodListings;
    } catch (error) {
        console.error('Error fetching listings:', error);
        return [];
    }
}

async function fetchReservations() {
    try {
        const response = await fetch(`${API_URL}/reservations`);
        const data = await response.json();
        allReservations = data;
        return allReservations;
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
    }
}

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
