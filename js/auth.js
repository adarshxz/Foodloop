        // Check for saved login on page load
        document.addEventListener('DOMContentLoaded', function () {
            const savedUser = localStorage.getItem('foodloopUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                updateUIForLoggedInUser();
            }
        });

        // Login Modal Functions
        function openLoginModal() {
            if (currentUser) {
                // Already logged in, show user profile or redirect
                return;
            }
            document.getElementById('loginModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLoginModal() {
            document.getElementById('loginModal').classList.remove('active');
            document.body.style.overflow = 'auto';
            resetLoginForm();
        }

        function resetLoginForm() {
            selectedUserType = null;
            isLoginMode = true;
            document.querySelectorAll('.user-type-card').forEach(card => {
                card.classList.remove('active');
            });
            document.getElementById('loginForm').classList.remove('active');
            document.getElementById('signupForm').classList.remove('active');
            document.getElementById('loginForm').reset();
            document.getElementById('signupForm').reset();
        }

        function selectUserType(type) {
            selectedUserType = type;

            // Update UI
            document.querySelectorAll('.user-type-card').forEach(card => {
                card.classList.remove('active');
            });
            event.target.closest('.user-type-card').classList.add('active');

            // Show login form by default
            showLoginForm();
        }

        function showLoginForm() {
            if (!selectedUserType) {
                alert('Please select whether you are a Donor or Recipient first');
                return;
            }
            isLoginMode = true;
            document.getElementById('signupForm').classList.remove('active');
            document.getElementById('loginForm').classList.add('active');
            document.getElementById('authTitle').textContent = 'Login to FoodLoop';
        }

        function showSignupForm() {
            if (!selectedUserType) {
                alert('Please select whether you are a Donor or Recipient first');
                return;
            }
            isLoginMode = false;
            document.getElementById('loginForm').classList.remove('active');
            document.getElementById('signupForm').classList.add('active');
            document.getElementById('authTitle').textContent = 'Create Your Account';
        }

        // Login Form Submission
        document.getElementById('loginForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const email = formData.get('email');
            const password = formData.get('password');

            // In production, validate with backend
            // For demo, accept any login
            currentUser = {
                id: Date.now(),
                email: email,
                name: email.split('@')[0],
                type: selectedUserType,
                loginTime: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('foodloopUser', JSON.stringify(currentUser));

            console.log('User logged in:', currentUser);

            updateUIForLoggedInUser();
            closeLoginModal();

            // Show success message
            alert(`Welcome back! You are logged in as a ${selectedUserType}.`);
        });

        // Signup Form Submission
        document.getElementById('signupForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const userData = {
                id: Date.now(),
                name: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                organization: formData.get('organization'),
                type: selectedUserType,
                registeredAt: new Date().toISOString()
            };

            // In production, send to backend
            console.log('New user registered:', userData);

            // Auto-login after signup
            currentUser = userData;
            localStorage.setItem('foodloopUser', JSON.stringify(currentUser));

            updateUIForLoggedInUser();
            closeLoginModal();

            // Show success message
            alert(`Account created successfully! Welcome to FoodLoop as a ${selectedUserType}.`);
        });

        function updateUIForLoggedInUser() {
            // Update user info bar
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userTypeLabel').textContent = currentUser.type.charAt(0).toUpperCase() + currentUser.type.slice(1);
            document.getElementById('userAvatar').textContent = currentUser.type === 'donor' ? '🤲' : '🍽️';
            document.getElementById('userInfoBar').classList.add('active');

            // Show dashboard button
            document.getElementById('myFoodDashboard').style.display = 'block';
            updateDashboard();

            // Hide login button in nav
            const loginLink = document.querySelector('.nav-links a[onclick*="openLoginModal"]');
            if (loginLink) {
                loginLink.style.display = 'none';
            }
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                currentUser = null;
                localStorage.removeItem('foodloopUser');

                // Update UI
                document.getElementById('userInfoBar').classList.remove('active');
                document.getElementById('myFoodDashboard').style.display = 'none';
                document.getElementById('dashboardPanel').classList.remove('active');

                // Show login button again
                const loginLink = document.querySelector('.nav-links a[onclick*="openLoginModal"]');
                if (loginLink) {
                    loginLink.style.display = 'inline';
                }

                alert('You have been logged out successfully.');
            }
        }

        // Dashboard Functions
        function toggleDashboard() {
            const panel = document.getElementById('dashboardPanel');
            panel.classList.toggle('active');

            if (panel.classList.contains('active')) {
                updateDashboard();
            }
        }

        function updateDashboard() {
            if (!currentUser) return;

            const content = document.getElementById('dashboardContent');
            const titleElement = document.getElementById('dashboardTitle');
            const subtitleElement = document.getElementById('dashboardSubtitle');
            const badge = document.getElementById('dashboardBadge');

            if (currentUser.type === 'donor') {
                // Show donor's listed food
                titleElement.textContent = 'My Listed Food';
                subtitleElement.textContent = 'Track your donations';

                // Filter by donor ID (most reliable) or donor name
                const myListedFood = availableFoodListings.filter(food =>
                    food.donorId === currentUser.id ||
                    food.donor === currentUser.name ||
                    food.donorName === currentUser.name
                );

                console.log('Current User:', currentUser.name, 'ID:', currentUser.id);
                console.log('My Listed Food:', myListedFood);
                console.log('All Available Food:', availableFoodListings);

                const reservations = JSON.parse(localStorage.getItem('foodloopReservations') || '[]');

                if (myListedFood.length === 0) {
                    content.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🍽️</div>
                            <h3>No Food Listed Yet</h3>
                            <p>Start donating food to see your listings here.</p>
                        </div>
                    `;
                    badge.style.display = 'none';
                } else {
                    let reservedCount = 0;
                    content.innerHTML = myListedFood.map(food => {
                        const foodReservations = reservations.filter(r => r.foodId === food.id);
                        const isReserved = foodReservations.length > 0;
                        if (isReserved) reservedCount++;

                        return `
                            <div class="food-item">
                                <div class="food-item-header">
                                    <h3 class="food-item-title">${food.name}</h3>
                                    <span class="status-badge ${isReserved ? 'status-reserved' : 'status-available'}">
                                        ${isReserved ? '✓ Reserved' : '⏳ Available'}
                                    </span>
                                </div>
                                <div class="food-item-details">
                                    <div class="detail-row">
                                        <span>🍽️</span>
                                        <span><span class="detail-label">Quantity:</span> ${food.quantity}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>📍</span>
                                        <span><span class="detail-label">Location:</span> ${food.location}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>⏰</span>
                                        <span><span class="detail-label">Best Before:</span> ${food.bestBefore}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>✨</span>
                                        <span><span class="detail-label">Condition:</span> ${food.condition}</span>
                                    </div>
                                </div>
                                ${isReserved ? foodReservations.map(res => `
                                    <div class="reservation-info">
                                        <h4>🎉 Reservation Details</h4>
                                        <div class="reservation-detail">
                                            <strong>Reserved by:</strong> ${res.recipientName}
                                        </div>
                                        <div class="reservation-detail">
                                            <strong>Email:</strong> ${res.recipientEmail}
                                        </div>
                                        <div class="reservation-detail">
                                            <strong>Phone:</strong> ${res.recipientPhone}
                                        </div>
                                        <div class="reservation-detail">
                                            <strong>Reserved at:</strong> ${new Date(res.reservedAt).toLocaleString()}
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div style="margin-top: 1rem; padding: 0.8rem; background: white; border-radius: 12px; text-align: center; color: var(--earth-brown); font-size: 0.9rem;">
                                        No reservations yet. Waiting for someone to reserve this food.
                                    </div>
                                `}
                                <button class="btn-remove-listing" onclick="removeListing(${food.id})">
                                    🗑️ Remove Listing
                                </button>
                            </div>
                        `;
                    }).join('');

                    // Update badge
                    if (reservedCount > 0) {
                        badge.textContent = reservedCount;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            } else {
                // Show recipient's reserved food
                titleElement.textContent = 'My Reserved Food';
                subtitleElement.textContent = 'Your upcoming pickups';

                const myReservations = JSON.parse(localStorage.getItem('foodloopReservations') || '[]')
                    .filter(r => r.recipientId === currentUser.id);

                if (myReservations.length === 0) {
                    content.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <h3>No Reservations Yet</h3>
                            <p>Browse "Find Food Nearby" to reserve meals.</p>
                        </div>
                    `;
                    badge.style.display = 'none';
                } else {
                    content.innerHTML = myReservations.map(reservation => {
                        const food = availableFoodListings.find(f => f.id === reservation.foodId);

                        return `
                            <div class="food-item">
                                <div class="food-item-header">
                                    <h3 class="food-item-title">${reservation.foodName}</h3>
                                    <span class="status-badge status-reserved">✓ Reserved</span>
                                </div>
                                <div class="food-item-details">
                                    <div class="detail-row">
                                        <span>🤲</span>
                                        <span><span class="detail-label">Donor:</span> ${reservation.donorName}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>📍</span>
                                        <span><span class="detail-label">Location:</span> ${reservation.location}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>⏰</span>
                                        <span><span class="detail-label">Pickup by:</span> ${reservation.bestBefore}</span>
                                    </div>
                                    ${food ? `
                                        <div class="detail-row">
                                            <span>🍽️</span>
                                            <span><span class="detail-label">Quantity:</span> ${food.quantity}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span>✨</span>
                                            <span><span class="detail-label">Condition:</span> ${food.condition}</span>
                                        </div>
                                        ${food.description ? `
                                            <div class="detail-row" style="margin-top: 0.5rem;">
                                                <span>📝</span>
                                                <span style="flex: 1;"><span class="detail-label">Description:</span> ${food.description}</span>
                                            </div>
                                        ` : ''}
                                    ` : ''}
                                </div>
                                <div class="reservation-info">
                                    <h4>📅 Reservation Info</h4>
                                    <div class="reservation-detail">
                                        <strong>Reserved at:</strong> ${new Date(reservation.reservedAt).toLocaleString()}
                                    </div>
                                    <div class="reservation-detail" style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid var(--soft-sage); color: var(--primary-green); font-weight: 600;">
                                        ⚠️ Please arrive on time for pickup
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

                    // Update badge
                    badge.textContent = myReservations.length;
                    badge.style.display = 'flex';
                }
            }
        }

        // Check if user is logged in before opening donation form
