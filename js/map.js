// --- MAP INTEGRATION START ---

// Note: Map variables are declared in data.js to avoid conflicts
// findMap, donationMap, donationMarker, userLocation, DEFAULT_LOCATION, mapMarkers

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', function () {
    // Initialize food data with coordinates if not present
    availableFoodListings.forEach(food => {
        if (!food.lat) {
            // Assign consistent coordinates based on ID seeded random-ish
            const seed = food.id * 123.45;
            food.lat = DEFAULT_LOCATION[0] + (Math.sin(seed) * 0.02);
            food.lng = DEFAULT_LOCATION[1] + (Math.cos(seed) * 0.02);
        }
    });

    // Fix Leaflet's default icon path issues
    if (typeof L !== 'undefined') {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }
});

function initFindMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // If map already initialized, just invalidate size (in case modal resized)
    if (findMap) {
        setTimeout(() => {
            findMap.invalidateSize();
            updateMapMarkers();
        }, 100);
        return;
    }

    findMap = L.map('map-container').setView(DEFAULT_LOCATION, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(findMap);

    // Try to get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];

                // Add Blue Dot for user
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="background-color: #4285F4; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                L.marker(userLocation, { icon: userIcon }).addTo(findMap)
                    .bindPopup("You are here").openPopup();

                findMap.setView(userLocation, 14);

                // Recalculate distances
                recalculateDistances();
            },
            (error) => {
                console.log("Geolocation blocked or failed, using default.");
            }
        );
    }

    updateMapMarkers();
}

function updateMapMarkers() {
    if (!findMap) return;

    // Clear existing markers
    mapMarkers.forEach(marker => findMap.removeLayer(marker));
    mapMarkers = [];

    // Filter food based on current filter
    let filteredFood = currentFilter === 'all'
        ? availableFoodListings
        : availableFoodListings.filter(food => food.type === currentFilter);

    filteredFood.forEach(food => {
        const marker = L.marker([food.lat, food.lng])
            .addTo(findMap)
            .bindPopup(`
                        <div style="text-align: center; min-width: 150px;">
                            <strong>${food.name}</strong><br>
                            ${formatFoodType(food.type)}<br>
                            ${food.price ? `<div style="margin-top: 4px; color: #2a9d8f; font-weight: 600;">💰 ${food.price}</div>` : ''}
                            ${food.contactNumber ? `<div style="margin-top: 4px; font-size: 0.85rem;">📞 ${food.contactNumber}</div>` : ''}
                            ${food.reserved ? `
                                <div style="margin-top: 8px; padding: 6px 12px; background: #f4a261; color: white; border-radius: 5px; font-weight: 600; font-size: 0.9rem;">
                                    ✓ Reserved by ${food.reservedByName}
                                </div>
                            ` : `
                            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
                                <a href="https://www.google.com/maps/dir/?api=1&destination=${food.lat},${food.lng}" 
                                   target="_blank"
                                   style="
                                    background: white; 
                                    color: var(--primary-green);
                                    border: 1px solid var(--primary-green);
                                    padding: 5px 10px;
                                    border-radius: 5px;
                                    text-decoration: none;
                                    font-size: 0.9rem;
                                    display: inline-block;
                                   ">
                                   📍 Get Directions
                                </a>
                                <button onclick="reserveFood(${food.id})" style="
                                    background: var(--primary-green);
                                    color: white;
                                    border: none;
                                    padding: 6px 10px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 0.9rem;
                                ">Reserve Now</button>
                            </div>
                            `}
                        </div>
                    `);

        mapMarkers.push(marker);
    });
}

function recalculateDistances() {
    if (!userLocation) return;

    availableFoodListings.forEach(food => {
        const dist = calculateDistance(
            userLocation[0], userLocation[1],
            food.lat, food.lng
        );
        food.distance = parseFloat(dist.toFixed(1));
    });

    // Re-render list
    displayFoodListings();
}

// Haversine Formula for distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function initDonationMap() {
    const mapId = 'donation-map';
    if (!document.getElementById(mapId)) return;

    // If already initialized, resize
    if (donationMap) {
        setTimeout(() => {
            donationMap.invalidateSize();
        }, 100);
        return;
    }

    donationMap = L.map(mapId).setView(DEFAULT_LOCATION, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(donationMap);

    donationMap.on('click', function (e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (donationMarker) {
            donationMarker.setLatLng(e.latlng);
        } else {
            donationMarker = L.marker(e.latlng).addTo(donationMap);
        }

        // Reverse geocoding could go here to fill the input box
        document.getElementById('locationInput').dataset.lat = lat;
        document.getElementById('locationInput').dataset.lng = lng;
        document.getElementById('locationInput').value = "Fetching address..."; // Feedback to user

        // Fetch address from Nominatim (OpenStreetMap)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    document.getElementById('locationInput').value = data.display_name;
                } else {
                    document.getElementById('locationInput').value = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                }
            })
            .catch(err => {
                console.error("Reverse geocoding failed:", err);
                document.getElementById('locationInput').value = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            });
    });

    // Try to find user location for donation map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const loc = [pos.coords.latitude, pos.coords.longitude];
            donationMap.setView(loc, 15);
        });
    }
}
