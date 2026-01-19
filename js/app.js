// Initialize food data with coordinates if not present
availableFoodListings.forEach(food => {
    if (!food.lat) {
        const seed = food.id * 123.45;
        food.lat = DEFAULT_LOCATION[0] + (Math.sin(seed) * 0.02);
        food.lng = DEFAULT_LOCATION[1] + (Math.cos(seed) * 0.02);
    }
});
// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Modal Functions
function openDonationModal() {
    document.getElementById('donationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('donationModal').classList.remove('active');
    document.body.style.overflow = 'auto';

    // Reset form
    document.getElementById('donationForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('donationForm').style.display = 'block';
    document.getElementById('successMessage').classList.remove('active');
}

// Image Preview Function
let uploadedImages = [];

function previewImages(event) {
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById('imagePreview');

    files.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                uploadedImages.push({
                    file: file,
                    url: e.target.result
                });

                const imgItem = document.createElement('div');
                imgItem.className = 'image-preview-item';
                imgItem.innerHTML = `
                            <img src="${e.target.result}" alt="Food preview">
                            <button type="button" class="remove-image" onclick="removeImage(${uploadedImages.length - 1})">×</button>
                        `;

                previewContainer.appendChild(imgItem);
            };

            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';

    uploadedImages.forEach((img, idx) => {
        const imgItem = document.createElement('div');
        imgItem.className = 'image-preview-item';
        imgItem.innerHTML = `
                    <img src="${img.url}" alt="Food preview">
                    <button type="button" class="remove-image" onclick="removeImage(${idx})">×</button>
                `;
        previewContainer.appendChild(imgItem);
    });
}

// Form Submission
document.getElementById('donationForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this);
    // Get coordinates from the input dataset (set by map pin)
    const latInput = document.getElementById('locationInput').dataset.lat;
    const lngInput = document.getElementById('locationInput').dataset.lng;

    let finalLat, finalLng;

    if (latInput && lngInput) {
        finalLat = parseFloat(latInput);
        finalLng = parseFloat(lngInput);
    } else {
        // Fallback: Generate random coords near default location if user didn't pin
        // In a real app, we'd Geocode the text address here
        const seed = Date.now();
        finalLat = DEFAULT_LOCATION[0] + (Math.sin(seed) * 0.02);
        finalLng = DEFAULT_LOCATION[1] + (Math.cos(seed) * 0.02);
    }

    // Calculate distance if user location is known
    let calculatedDistance = 0;
    if (userLocation) {
        calculatedDistance = parseFloat(calculateDistance(
            userLocation[0], userLocation[1],
            finalLat, finalLng
        ).toFixed(1));
    } else {
        calculatedDistance = parseFloat((Math.random() * 2).toFixed(1));
    }

    const donationData = {
        id: Date.now(),
        name: formData.get('foodName'),
        type: formData.get('foodType'),
        quantity: formData.get('quantity'),
        description: formData.get('description') || 'No description provided',
        bestBefore: formData.get('bestBefore'),
        condition: formData.get('condition'),
        location: formData.get('location'),
        lat: finalLat,
        lng: finalLng,
        donor: currentUser.name, // Use current user's name
        donorName: currentUser.name, // Also set donorName for consistency
        donorId: currentUser.id, // Store donor ID for matching
        organization: formData.get('organization') || 'Individual',
        contactNumber: formData.get('contactNumber') || '',
        price: formData.get('price') || '',
        distance: calculatedDistance,
        image: getFoodEmoji(formData.get('foodType')),
        listedAt: new Date().toISOString(),
        reserved: false // Initialize as not reserved
    };

    // Add images
    donationData.images = uploadedImages.map(img => img.file.name);

    // Add to available food listings
    availableFoodListings.unshift(donationData); // Add to beginning of array

    // Sort by distance
    availableFoodListings.sort((a, b) => a.distance - b.distance);

    // Update map markers immediately so they show up if map is open or opened later
    if (findMap) {
        updateMapMarkers();
    }

    // Log the data (in production, this would be sent to backend)
    console.log('Donation Data:', donationData);
    console.log('Uploaded Images:', uploadedImages);
    console.log('Updated Food Listings:', availableFoodListings);

    // Show success message
    document.getElementById('donationForm').style.display = 'none';
    document.getElementById('successMessage').classList.add('active');

    // Update dashboard if it's open
    updateDashboard();

    // In production, you would send this data to your backend:
    /*
    fetch('/api/donations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData)
    })
    .then(response => response.json())
    .then(data => {
        // Show success message
        document.getElementById('donationForm').style.display = 'none';
        document.getElementById('successMessage').classList.add('active');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    });
    */
});

function getFoodEmoji(foodType) {
    const emojis = {
        'vegetarian': '🥗',
        'non-vegetarian': '🍗',
        'vegan': '🌱',
        'mixed': '🍽️'
    };
    return emojis[foodType] || '🍲';
}

// Add click handlers to all "Donate Food" and "Find Food" buttons
document.addEventListener('DOMContentLoaded', function () {
    // Check for saved login
    const savedUser = localStorage.getItem('foodloopUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }

    const allButtons = document.querySelectorAll('a[href="#"]:not([class*="social-icon"])');
    allButtons.forEach(button => {
        if (button.textContent.includes('Donate Food') ||
            button.textContent.includes('Start Donating') ||
            button.textContent.includes('Donating Food')) {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                openDonationModal();
            });
        }

        // Add handlers for "Find Food" buttons
        if (button.textContent.includes('Find Food') ||
            button.textContent.includes('Find Food Nearby') ||
            button.textContent.includes('Find Food Near You')) {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                openFindFoodModal();
            });
        }
    });
});
function openDonationModal() {
    if (!currentUser) {
        alert('Please login as a Donor to list food.');
        openLoginModal();
        return;
    }

    if (currentUser.type !== 'donor') {
        alert('Only donors can list food. Please login with a donor account.');
        return;
    }

    document.getElementById('donationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Find Food Modal Functions
function openFindFoodModal() {
    document.getElementById('findFoodModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    displayFoodListings();
}

function closeFindFoodModal() {
    document.getElementById('findFoodModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentFilter = 'all';
    updateFilterButtons();
}

function displayFoodListings() {
    const container = document.getElementById('foodListings');

    // Filter food based on current filter
    let filteredFood = currentFilter === 'all'
        ? availableFoodListings
        : availableFoodListings.filter(food => food.type === currentFilter);

    // Sort by distance (already sorted in sample data, but ensuring it)
    filteredFood.sort((a, b) => a.distance - b.distance);

    if (filteredFood.length === 0) {
        container.innerHTML = `
                    <div class="no-food-message">
                        <div class="no-food-icon">🍽️</div>
                        <h3>No Food Available</h3>
                        <p>There are no ${currentFilter === 'all' ? '' : currentFilter} food listings nearby at the moment. Check back soon!</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = filteredFood.map(food => `
                <div class="food-card ${food.reserved ? 'reserved' : ''}" data-type="${food.type}">
                    <div class="food-image-placeholder">
                        ${food.image}
                        ${food.reserved ? '<div class="reserved-overlay">✓ RESERVED</div>' : ''}
                    </div>
                    <div class="food-details">
                        <div class="food-header">
                            <div>
                                <h3 class="food-title">${food.name}</h3>
                                <span class="food-type-badge">${formatFoodType(food.type)}</span>
                            </div>
                            <div class="food-distance">📍 ${food.distance} km</div>
                        </div>
                        
                        <div class="food-info-grid">
                            <div class="food-info-item">
                                <span>🍽️</span>
                                <span>${food.quantity}</span>
                            </div>
                            <div class="food-info-item">
                                <span>⏰</span>
                                <span>${food.bestBefore}</span>
                            </div>
                            <div class="food-info-item">
                                <span>✨</span>
                                <span>${food.condition}</span>
                            </div>
                            ${food.price ? `
                            <div class="food-info-item">
                                <span>💰</span>
                                <span>${food.price}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <p class="food-description">${food.description}</p>
                        
                        <div class="food-location">
                            <span>📍</span>
                            <span>${food.location}</span>
                        </div>
                        
                        ${food.contactNumber ? `
                        <div class="food-contact">
                            <span>📞</span>
                            <span>${food.contactNumber}</span>
                        </div>
                        ` : ''}
                        
                        <div class="food-meta">
                            <div class="food-donor">
                                By <strong>${food.donor}</strong>
                                ${food.organization ? `<br><small>${food.organization}</small>` : ''}
                            </div>
                            ${food.reserved ?
            '<div class="reserved-badge">✓ Reserved by ' + food.reservedByName + '</div>' :
            '<button class="btn-reserve" onclick="reserveFood(' + food.id + ')">Reserve Now</button>'
        }
                        </div>
                    </div>
                </div>
            `).join('');
}

function formatFoodType(type) {
    const types = {
        'vegetarian': '🥗 Vegetarian',
        'non-vegetarian': '🍖 Non-Veg',
        'vegan': '🌱 Vegan',
        'mixed': '🍽️ Mixed'
    };
    return types[type] || type;
}

function filterFood(type) {
    currentFilter = type;
    updateFilterButtons();
    displayFoodListings();
}

function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = Array.from(document.querySelectorAll('.filter-btn')).find(btn => {
        if (currentFilter === 'all') return btn.textContent.includes('All Food');
        if (currentFilter === 'vegetarian') return btn.textContent.includes('Vegetarian');
        if (currentFilter === 'non-vegetarian') return btn.textContent.includes('Non-Veg');
        if (currentFilter === 'vegan') return btn.textContent.includes('Vegan');
        return false;
    });

    if (activeBtn) activeBtn.classList.add('active');
}

function reserveFood(foodId) {
    // Check if user is logged in
    if (!currentUser) {
        alert('Please login to reserve food.');
        openLoginModal();
        return;
    }

    const food = availableFoodListings.find(f => f.id === foodId);
    if (food) {
        // Check if already reserved
        if (food.reserved) {
            alert('This food has already been reserved.');
            return;
        }

        // Create reservation data
        const reservation = {
            id: Date.now(),
            foodId: food.id,
            foodName: food.name,
            recipientId: currentUser.id,
            recipientName: currentUser.name,
            recipientEmail: currentUser.email,
            recipientPhone: currentUser.phone || 'Not provided',
            donorName: food.donor,
            donorContact: food.contactNumber || 'Not provided',
            location: food.location,
            bestBefore: food.bestBefore,
            price: food.price || 'Free',
            reservedAt: new Date().toISOString()
        };

        // Mark food as reserved
        food.reserved = true;
        food.reservedBy = currentUser.id;
        food.reservedByName = currentUser.name;

        // Store reservation first
        let reservations = JSON.parse(localStorage.getItem('foodloopReservations') || '[]');
        reservations.push(reservation);
        localStorage.setItem('foodloopReservations', JSON.stringify(reservations));

        // Update dashboard if it's open
        updateDashboard();

        // Refresh the food listings display to show "Reserved" badge
        displayFoodListings();

        // Update map markers to show reserved status
        if (findMap) {
            updateMapMarkers();
        }

        // Show simple success alert to recipient ONLY
        const contactInfo = food.contactNumber ? `\n\nDonor Contact: ${food.contactNumber}` : '';
        const priceInfo = food.price ? `\nPrice: ${food.price}` : '\nPrice: Free';
        alert(`🎉 Food Reserved Successfully!\n\nYou have reserved:\n${food.name}\n\nLocation: ${food.location}\nPickup by: ${food.bestBefore}${priceInfo}${contactInfo}\n\nThe donor has been notified. Please arrive on time for pickup.`);

        // Log reservation data
        console.log('Food Reserved:', reservation);
        console.log('Notification would be sent to donor:', food.donor);

        // In production, you would call your backend which would send notification to ONLY the donor:
        /*
        fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservation)
        })
        .then(response => response.json())
        .then(data => {
            // Backend sends WebSocket/Push Notification ONLY to the donor
            // The donor would call showDonorNotification() on their device
            alert('Food reserved successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to reserve food. Please try again.');
        });
        */

        // FOR DEMO ONLY: Simulate donor receiving notification
        // In production, this would ONLY run on the donor's device via WebSocket
        // COMMENTED OUT: Uncomment this line to see how the donor notification would look
        // simulateDonorReceivingNotification(reservation);

        // The notification card shown in your screenshot would ONLY appear on the 
        // actual donor's device when their backend receives the reservation
    }
}

// FOR DEMO ONLY: Simulate what the donor sees
// In production, this function would only be triggered on the donor's device
function simulateDonorReceivingNotification(reservation) {
    console.log('=== DEMO MODE ===');
    console.log('In production, this notification would ONLY appear on the donor\'s device');
    console.log('The recipient would NOT see this notification');
    console.log('================');

    // Only show notification if you want to demo the donor experience
    // Comment this line out to hide notification completely:
    showDonorNotification(reservation);
}

// This function would ONLY be called on the donor's device via WebSocket/Push in production
function showDonorNotification(reservation) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
                <button class="notification-close" onclick="this.parentElement.remove()">×</button>
                <div class="notification-header">
                    <div class="notification-icon">🎉</div>
                    <div class="notification-content">
                        <div class="notification-title">Food Reserved!</div>
                        <div class="notification-message">
                            <span class="notification-recipient">${reservation.recipientName}</span> has reserved your 
                            <span class="notification-food-name">${reservation.foodName}</span>.
                        </div>
                    </div>
                </div>
                <div class="notification-actions">
                    <button class="notification-btn notification-btn-primary" onclick="viewReservationDetails(${reservation.id})">View Details</button>
                    <button class="notification-btn notification-btn-secondary" onclick="this.closest('.notification').remove()">Dismiss</button>
                </div>
            `;

    const container = document.getElementById('notificationContainer');
    container.appendChild(notification);

    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.5s ease-in reverse forwards';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Override existing open functions to init maps
const originalOpenFind = openFindFoodModal;
openFindFoodModal = function () {
    originalOpenFind();
    setTimeout(initFindMap, 200); // Delay slightly for modal animation
};

const originalOpenDonate = openDonationModal;
openDonationModal = function () {
    originalOpenDonate();
    setTimeout(initDonationMap, 200);
};

// Hook into filter update to also update map markers
const originalFilterFood = filterFood;
filterFood = function (type) {
    originalFilterFood(type);
    updateMapMarkers();
};

// --- MAP INTEGRATION END ---

function viewReservationDetails(reservationId) {
    const reservations = JSON.parse(localStorage.getItem('foodloopReservations') || '[]');
    const reservation = reservations.find(r => r.id === reservationId);

    if (reservation) {
        // Format the datetime for better display
        const pickupTime = reservation.bestBefore;
        const reservedTime = new Date(reservation.reservedAt).toLocaleString();

        // Show detailed reservation info to donor
        alert(`📋 Reservation Details\n\n` +
            `Food: ${reservation.foodName}\n` +
            `Reserved by: ${reservation.recipientName}\n` +
            `Email: ${reservation.recipientEmail}\n` +
            `Phone: ${reservation.recipientPhone}\n` +
            `Location: ${reservation.location}\n` +
            `Pickup by: ${pickupTime}\n` +
            `Reserved at: ${reservedTime}\n\n` +
            `Please coordinate with the recipient for pickup.`);
    }

    // Close the notification
    event.target.closest('.notification').remove();
}

// Add CSS for slide out animation
const style = document.createElement('style');
style.textContent = `
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
        `;
document.head.appendChild(style);

// Final check for removeListing function
function removeListing(foodId) {
    if (!confirm('Are you sure you want to remove this listing? This action cannot be undone.')) {
        return;
    }

    // Find the index of the food to remove
    const index = availableFoodListings.findIndex(f => f.id === foodId);

    if (index !== -1) {
        // Remove from the array
        availableFoodListings.splice(index, 1);

        // Update markers if map exists
        if (findMap) {
            updateMapMarkers();
        }

        // Refresh dashboard
        updateDashboard();

        // Refresh food listings if open
        if (document.getElementById('findFoodModal').classList.contains('active')) {
            displayFoodListings();
        }

        alert('Listing removed successfully.');
    }
}

// Close modal when clicking outside
document.getElementById('findFoodModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeFindFoodModal();
    }
});

document.getElementById('loginModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeLoginModal();
    }
});

// Close modal when clicking outside
document.getElementById('donationModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal();
        closeFindFoodModal();
        closeLoginModal();
    }
});
