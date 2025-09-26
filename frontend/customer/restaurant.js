const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'customer') {
  window.location.href = "../login.html";
}

// Get restaurant ID
const restaurantId = localStorage.getItem('selectedRestaurant');
if (!restaurantId) {
  window.location.href = 'customer_dashboard.html';
}

// Global variables
let menuItems = [];
let categories = [];
let currentCategory = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadRestaurantInfo();
  loadMenuItems();
  updateCartCount();
});

// Load restaurant information
async function loadRestaurantInfo() {
  try {
    const response = await fetch(`${API_BASE}/customer/restaurant_info.php?id=${restaurantId}`);
    const result = await response.json();
    
    if (result.success) {
      const restaurant = result.data;
      document.getElementById('restaurantName').textContent = restaurant.name;
      document.getElementById('restaurantLocation').textContent = `📍 ${restaurant.location}`;
      document.getElementById('restaurantDescription').textContent = restaurant.description || '';
    }
  } catch (error) {
    console.error('Error loading restaurant info:', error);
  }
}

// Load menu items
async function loadMenuItems() {
  try {
    const response = await fetch(`${API_BASE}/customer/menu.php?restaurant_id=${restaurantId}`);
    const result = await response.json();
    
    if (result.success) {
      menuItems = result.data;
      extractCategories();
      displayCategories();
      displayMenuItems(menuItems);
    } else {
      showEmptyMenu();
    }
  } catch (error) {
    showEmptyMenu();
  }
}

// Extract unique categories
function extractCategories() {
  categories = [...new Set(menuItems.map(item => item.category))];
}

// Display category filters
function displayCategories() {
  const categoriesContainer = document.getElementById('menuCategories');
  const categoryButtons = categories.map(category => 
    `<button class="category-btn" onclick="filterMenu('${category}')">${category}</button>`
  ).join('');
  
  categoriesContainer.innerHTML = `
    <button class="category-btn active" onclick="filterMenu('all')">All Items</button>
    ${categoryButtons}
  `;
}

// Filter menu by category
function filterMenu(category) {
  currentCategory = category;
  
  // Update active button
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Filter items
  const filteredItems = category === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === category);
  
  displayMenuItems(filteredItems);
}

// Display menu items
function displayMenuItems(items) {
  const container = document.getElementById('menuItems');
  
  if (items.length === 0) {
    showEmptyMenu();
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="menu-item-card">
    <div class="menu-item-image">
      <img src="${item.image_url ? item.image_url : '../default.png'}" 
           alt="${item.name}" />
    </div>
      <div class="menu-item-info">
        <h4>${item.name}</h4>
        <div class="menu-item-description">${item.description || ''}</div>
        <div class="menu-item-price">৳${parseFloat(item.price).toFixed(2)}</div>
      </div>
      <div class="menu-item-actions">
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="changeQuantity(${item.menu_item_id}, -1)">-</button>
          <span class="quantity-display" id="qty-${item.menu_item_id}">0</span>
          <button class="quantity-btn" onclick="changeQuantity(${item.menu_item_id}, 1)">+</button>
        </div>
        <button class="btn-primary" onclick="addToCart(${item.menu_item_id})">Add to Cart</button>
      </div>
    </div>
  `).join('');
  
  // Update quantities from cart
  updateQuantityDisplays();
}

// Change quantity
function changeQuantity(menuItemId, change) {
  const qtyElement = document.getElementById(`qty-${menuItemId}`);
  let currentQty = parseInt(qtyElement.textContent);
  let newQty = Math.max(0, currentQty + change);
  
  qtyElement.textContent = newQty;
  
  if (newQty > 0) {
    updateCartItem(menuItemId, newQty);
  } else {
    removeFromCart(menuItemId);
  }
}

// Add to cart
function addToCart(menuItemId) {
  const qtyElement = document.getElementById(`qty-${menuItemId}`);
  const quantity = parseInt(qtyElement.textContent) || 1;
  
  if (quantity === 0) {
    qtyElement.textContent = '1';
  }
  
  updateCartItem(menuItemId, quantity || 1);
}

// Update cart item
function updateCartItem(menuItemId, quantity) {
  const menuItem = menuItems.find(item => item.menu_item_id == menuItemId);
  if (!menuItem) return;
  
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingIndex = cart.findIndex(item => item.menu_item_id == menuItemId);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity = quantity;
  } else {
    cart.push({
      menu_item_id: menuItemId,
      restaurant_id: restaurantId,
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantity
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Remove from cart
function removeFromCart(menuItemId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.menu_item_id != menuItemId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Update quantity displays
function updateQuantityDisplays() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  cart.forEach(cartItem => {
    if (cartItem.restaurant_id == restaurantId) {
      const qtyElement = document.getElementById(`qty-${cartItem.menu_item_id}`);
      if (qtyElement) {
        qtyElement.textContent = cartItem.quantity;
      }
    }
  });
}

// Update cart count
function updateCartCount() {
  const cartData = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

// Show empty menu
function showEmptyMenu() {
  document.getElementById('menuItems').innerHTML = `
    <div class="empty-message">
      <h3>🍽️</h3>
      <p>No menu items available</p>
    </div>
  `;
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '../index.html';
}