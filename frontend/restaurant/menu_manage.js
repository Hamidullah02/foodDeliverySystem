const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'restaurant') {
  window.location.href = "../login.html";
}

// Global variables
let restaurantData = null;
let menuItems = [];
let categories = new Set();
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadRestaurantInfo();
  setupForm();
});

// Load restaurant information
async function loadRestaurantInfo() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/info.php?owner_id=${userData.user_id}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      restaurantData = result.data;
      if (restaurantData.status === 'approved') {
        loadMenuItems();
      } else {
        showRestaurantNotApproved();
      }
    } else {
      showNoRestaurant();
    }
  } catch (error) {
    showError("Failed to load restaurant information");
  }
}

// Load menu items
async function loadMenuItems() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/menu_items.php?restaurant_id=${restaurantData.restaurant_id}`);
    const result = await response.json();
    
    if (result.success) {
      menuItems = result.data;
      extractCategories();
      displayCategoryFilters();
      displayMenuItems(menuItems);
    } else {
      showEmptyMenu();
    }
  } catch (error) {
    showError("Failed to load menu items");
  }
}

// Extract categories from menu items
function extractCategories() {
  categories.clear();
  categories.add('all');
  menuItems.forEach(item => categories.add(item.category));
}

// Display category filters
function displayCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  const categoryButtons = Array.from(categories).map(category => {
    const isActive = category === currentFilter ? 'active' : '';
    const displayName = category === 'all' ? 'All Items' : category.charAt(0).toUpperCase() + category.slice(1);
    return `<button class="category-pill ${isActive}" onclick="filterMenuItems('${category}')">${displayName}</button>`;
  }).join('');
  
  container.innerHTML = categoryButtons;
}

// Filter menu items by category
function filterMenuItems(category) {
  currentFilter = category;
  displayCategoryFilters();
  
  const filteredItems = category === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === category);
  
  displayMenuItems(filteredItems);
}

// Display menu items
function displayMenuItems(items) {
  const container = document.getElementById('menuItemsContainer');
  
  if (items.length === 0) {
    const message = currentFilter === 'all' ? 
      "No menu items yet. Add your first item!" : 
      `No items in ${currentFilter} category.`;
    
    container.innerHTML = `
      <div class="empty-state">
        <h3>🍽️</h3>
        <p>${message}</p>
        <button onclick="showAddItemModal()" class="btn-primary">Add Menu Item</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="menu-item-card">
      <div class="menu-item-info">
        <h4>${item.name}</h4>
        <div class="menu-item-category">${item.category}</div>
        <div class="menu-item-description">${item.description || 'No description'}</div>
        <div class="menu-item-price">৳${parseFloat(item.price).toFixed(2)}</div>
        <div class="availability-status ${item.is_available == 1 ? 'available' : 'unavailable'}">
          ${item.is_available == 1 ? '✅ Available' : '❌ Unavailable'}
        </div>
      </div>
      <div class="menu-item-actions">
        <button onclick="editMenuItem(${item.menu_item_id})" class="btn-secondary">Edit</button>
        <button onclick="toggleAvailability(${item.menu_item_id}, ${item.is_available})" 
                class="btn-warning">
          ${item.is_available == 1 ? 'Disable' : 'Enable'}
        </button>
        <button onclick="deleteMenuItem(${item.menu_item_id})" class="btn-danger">Delete</button>
      </div>
    </div>
  `).join('');
}

// Show add item modal
function showAddItemModal() {
  if (!restaurantData || restaurantData.status !== 'approved') {
    alert("Your restaurant must be approved before adding menu items.");
    return;
  }
  
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('menuItemForm').reset();
  document.getElementById('menuItemId').value = '';
  document.getElementById('availabilityToggle').checked = true;
  document.getElementById('menuItemModal').style.display = 'block';
}

// Edit menu item
function editMenuItem(menuItemId) {
  const item = menuItems.find(i => i.menu_item_id == menuItemId);
  if (!item) return;
  
  document.getElementById('modalTitle').textContent = 'Edit Menu Item';
  const form = document.getElementById('menuItemForm');
  form.elements['menu_item_id'].value = item.menu_item_id;
  form.elements['name'].value = item.name;
  form.elements['description'].value = item.description || '';
  form.elements['price'].value = item.price;
  form.elements['category'].value = item.category;
  form.elements['is_available'].checked = item.is_available == 1;
  
  document.getElementById('menuItemModal').style.display = 'block';
}

// Toggle item availability
async function toggleAvailability(menuItemId, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  
  try {
    const formData = new FormData();
    formData.append('menu_item_id', menuItemId);
    formData.append('is_available', newStatus);
    formData.append('action', 'toggle_availability');
    
    const response = await fetch(`${API_BASE}/restaurant/menu_items.php`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      loadMenuItems(); // Reload to show updated status
    } else {
      alert(result.message || 'Failed to update availability');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Delete menu item
async function deleteMenuItem(menuItemId) {
  if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('menu_item_id', menuItemId);
    formData.append('action', 'delete');
    
    const response = await fetch(`${API_BASE}/restaurant/menu_items.php`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Menu item deleted successfully');
      loadMenuItems();
    } else {
      alert(result.message || 'Failed to delete menu item');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Setup form submission
function setupForm() {
  document.getElementById('menuItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.save-text');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading state
    btnText.classList.add('hidden');
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const formData = new FormData(e.target);
    formData.append('restaurant_id', restaurantData.restaurant_id);
    formData.append('is_available', document.getElementById('availabilityToggle').checked ? 1 : 0);
    
    const isEdit = document.getElementById('menuItemId').value;
    formData.append('action', isEdit ? 'update' : 'create');
    
    try {
      const response = await fetch(`${API_BASE}/restaurant/menu_items.php`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(isEdit ? 'Menu item updated successfully!' : 'Menu item added successfully!');
        closeModal();
        loadMenuItems();
      } else {
        alert(result.message || 'Failed to save menu item');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      // Reset button state
      btnText.classList.remove('hidden');
      loading.classList.add('hidden');
      submitBtn.disabled = false;
    }
  });
}

// Close modal
function closeModal() {
  document.getElementById('menuItemModal').style.display = 'none';
}

// Show states
function showRestaurantNotApproved() {
  document.getElementById('menuItemsContainer').innerHTML = `
    <div class="empty-state">
      <h3>⏳</h3>
      <p>Your restaurant is still pending approval.</p>
      <p>You can manage your menu once it's approved by admin.</p>
    </div>
  `;
}

function showNoRestaurant() {
  document.getElementById('menuItemsContainer').innerHTML = `
    <div class="empty-state">
      <h3>🏪</h3>
      <p>Please set up your restaurant first.</p>
      <a href="restaurant_setup.html" class="btn-primary">Setup Restaurant</a>
    </div>
  `;
}

function showEmptyMenu() {
  document.getElementById('menuItemsContainer').innerHTML = `
    <div class="empty-state">
      <h3>🍽️</h3>
      <p>No menu items yet. Add your first item!</p>
      <button onclick="showAddItemModal()" class="btn-primary">Add Menu Item</button>
    </div>
  `;
}

function showError(message) {
  document.getElementById('menuItemsContainer').innerHTML = `
    <div class="empty-state">
      <h3>❌</h3>
      <p>${message}</p>
      <button onclick="loadMenuItems()" class="btn-primary">Try Again</button>
    </div>
  `;
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('menuItemModal');
  if (event.target == modal) {
    closeModal();
  }
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}