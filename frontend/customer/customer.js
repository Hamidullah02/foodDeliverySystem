const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'customer') {
  window.location.href = "../login.html";
}

// Update user name
document.getElementById("userName").textContent = userData.name;

// Global variables
let restaurants = [];
let cart = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadRestaurants();
  updateCartCount();
});

// Load restaurants
async function loadRestaurants() {
  try {
    const response = await fetch(`${API_BASE}/customer/restaurants.php`);
    const result = await response.json();
    
    if (result.success) {
      restaurants = result.data;
      displayRestaurants(restaurants);
    } else {
      showEmptyState("No restaurants available");
    }
  } catch (error) {
    showEmptyState("Error loading restaurants");
  }
}

// Display restaurants
function displayRestaurants(restaurantList) {
  const grid = document.getElementById('restaurantsGrid');
  
  if (restaurantList.length === 0) {
    showEmptyState("No restaurants found");
    return;
  }
  
  grid.innerHTML = restaurantList.map(restaurant => `
    <div class="restaurant-card" onclick="viewRestaurant(${restaurant.restaurant_id})">
      <div class="restaurant-header">
        <div class="restaurant-info">
          <h3>${restaurant.name}</h3>
          <div class="restaurant-location">${restaurant.location}</div>
        </div>
        <span class="restaurant-status status-open">Open</span>
      </div>
      <div class="restaurant-description">
        ${restaurant.description || 'Delicious food awaits you!'}
      </div>
      <div class="restaurant-actions">
        <button class="btn-primary" onclick="event.stopPropagation(); viewMenu(${restaurant.restaurant_id})">
          View Menu
        </button>
      </div>
    </div>
  `).join('');
}

// Search restaurants
function searchRestaurants() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(query) ||
    restaurant.location.toLowerCase().includes(query) ||
    (restaurant.description && restaurant.description.toLowerCase().includes(query))
  );
  displayRestaurants(filtered);
}

// View restaurant details
function viewRestaurant(restaurantId) {
  localStorage.setItem('selectedRestaurant', restaurantId);
  window.location.href = 'restaurant.html';
}

// View menu
function viewMenu(restaurantId) {
  localStorage.setItem('selectedRestaurant', restaurantId);
  window.location.href = 'restaurant.html';
}

// Show empty state
function showEmptyState(message) {
  document.getElementById('restaurantsGrid').innerHTML = `
    <div class="empty-message">
      <h3>🍽️</h3>
      <p>${message}</p>
    </div>
  `;
}

// Update cart count
function updateCartCount() {
  const cartData = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '../index.html';
}