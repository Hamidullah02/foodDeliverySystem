const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'restaurant') {
  window.location.href = "../login.html";
}

// Global variables
let restaurantData = null;

// Initializepage
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("ownerName").textContent = userData.name;
  loadRestaurantInfo();
  setupEditForm();
});

// Load restaurant info
async function loadRestaurantInfo() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/info.php?owner_id=${userData.user_id}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      restaurantData = result.data;
      showRestaurantInfo();
      loadStats();
      loadRecentOrders();
    } else {
      showSetupNotice();
    }
  } catch (error) {
    showSetupNotice();
  }
}

// Show restaurant-info
function showRestaurantInfo() {
  document.getElementById('setupNotice').classList.add('hidden');
  document.getElementById('restaurantInfo').classList.remove('hidden');
  document.getElementById('quickStats').classList.remove('hidden');
  document.getElementById('recentOrders').classList.remove('hidden');
  
  const detailsContainer = document.getElementById('restaurantDetails');
  detailsContainer.innerHTML = `
    <div class="restaurant-detail-item">
      <strong>Name:</strong>
      <span>${restaurantData.name}</span>
    </div>
    <div class="restaurant-detail-item">
      <strong>Location:</strong>
      <span>${restaurantData.location}</span>
    </div>
    <div class="restaurant-detail-item">
      <strong>Description:</strong>
      <span>${restaurantData.description || 'No description provided'}</span>
    </div>
    <div class="restaurant-detail-item">
      <strong>Status:</strong>
      <span class="restaurant-status-badge status-${restaurantData.status}">${restaurantData.status}</span>
    </div>
  `;
}

//setup notice
function showSetupNotice() {
  document.getElementById('setupNotice').classList.remove('hidden');
  document.getElementById('restaurantInfo').classList.add('hidden');
  document.getElementById('quickStats').classList.add('hidden');
  document.getElementById('recentOrders').classList.add('hidden');
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/stats.php?restaurant_id=${restaurantData.restaurant_id}`);
    const result = await response.json();
    
    if (result.success) {
      document.getElementById('totalMenuItems').textContent = result.data.total_menu_items;
      document.getElementById('pendingOrders').textContent = result.data.pending_orders;
      document.getElementById('todayOrders').textContent = result.data.today_orders;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load recent orders
async function loadRecentOrders() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/orders.php?restaurant_id=${restaurantData.restaurant_id}&limit=5`);
    const result = await response.json();
    
    if (result.success) {
      displayRecentOrders(result.data);
    } else {
      showEmptyOrders();
    }
  } catch (error) {
    showEmptyOrders();
  }
}

// Display recent orders
function displayRecentOrders(orders) {
  const container = document.getElementById('ordersContainer');
  
  if (orders.length === 0) {
    showEmptyOrders();
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <div class="order-info">
          <h4>Order #${order.order_id}</h4>
          <div class="order-date">${formatDate(order.created_at)}</div>
        </div>
        <span class="status status-${order.status}">${order.status}</span>
      </div>
      <div class="order-customer-info">
        <h5>Customer: ${order.customer_name}</h5>
        <p>📞 ${order.phone}</p>
        <p>📍 ${order.delivery_address}</p>
      </div>
      <div class="order-total">
        Total: ৳${parseFloat(order.total_amount).toFixed(2)}
      </div>
    </div>
  `).join('');
}

// Show empty orders
function showEmptyOrders() {
  document.getElementById('ordersContainer').innerHTML = `
    <div class="empty-state">
      <h3>📋</h3>
      <p>No recent orders</p>
    </div>
  `;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Edit restaurant
function editRestaurant() {
  if (!restaurantData) return;
  
  const form = document.getElementById('editRestaurantForm');
  form.elements['name'].value = restaurantData.name;
  form.elements['location'].value = restaurantData.location;
  form.elements['description'].value = restaurantData.description || '';
  
  document.getElementById('editModal').style.display = 'block';
}

// Setup edit form
function setupEditForm() {
  document.getElementById('editRestaurantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('restaurant_id', restaurantData.restaurant_id);
    
    try {
      const response = await fetch(`${API_BASE}/restaurant/update.php`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Restaurant updated successfully!');
        closeModal();
        loadRestaurantInfo();
      } else {
        alert(result.message || 'Failed to update restaurant');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
}

// Close modal
function closeModal() {
  document.getElementById('editModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target == modal) {
    closeModal();
  }
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}