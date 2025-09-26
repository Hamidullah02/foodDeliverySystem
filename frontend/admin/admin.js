const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'admin') {
  window.location.href = "../login.html";
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadStats();
  loadPendingRestaurants();
  loadRecentOrders();
});

// Load system statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats.php`);
    const result = await response.json();
    if (result.success) {
      document.getElementById('totalUsers').textContent = result.data.total_users;
      document.getElementById('totalRestaurants').textContent = result.data.total_restaurants;
      document.getElementById('pendingApprovals').textContent = result.data.pending_approvals;
      document.getElementById('totalOrders').textContent = result.data.total_orders;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load pending restaurants
async function loadPendingRestaurants() {
  try {
    const response = await fetch(`${API_BASE}/admin/pending_restaurants.php`);
    const result = await response.json();
    
    if (result.success) {
      displayPendingRestaurants(result.data);
    } else {
      showEmptyPending();
    }
  } catch (error) {
    showEmptyPending();
  }
}

// Display pending restaurants
function displayPendingRestaurants(restaurants) {
  const container = document.getElementById('pendingRestaurants');
  
  if (restaurants.length === 0) {
    showEmptyPending();
    return;
  }
  
  container.innerHTML = restaurants.map(restaurant => `
    <div class="approval-card">
      <div class="approval-header">
        <div class="approval-info">
          <h4>${restaurant.name}</h4>
          <div class="approval-date">Applied: ${formatDate(restaurant.created_at)}</div>
          <div class="approval-date">Owner: ${restaurant.owner_name}</div>
        </div>
      </div>
      <div class="approval-details">
        <p><strong>Location:</strong> ${restaurant.location}</p>
        <p><strong>Description:</strong> ${restaurant.description || 'No description provided'}</p>
      </div>
      <div class="approval-actions">
        <button class="btn-success" onclick="approveRestaurant(${restaurant.restaurant_id})">
          Approve
        </button>
        <button class="btn-danger" onclick="rejectRestaurant(${restaurant.restaurant_id})">
          Reject
        </button>
      </div>
    </div>
  `).join('');
}

// Show empty pending state
function showEmptyPending() {
  document.getElementById('pendingRestaurants').innerHTML = `
    <div class="empty-state">
      <h3>✅</h3>
      <p>No pending restaurant approvals</p>
    </div>
  `;
}

// Load recent orders
async function loadRecentOrders() {
  try {
    const response = await fetch(`${API_BASE}/admin/recent_orders.php?limit=10`);
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
  const container = document.getElementById('recentOrders');
  
  if (orders.length === 0) {
    showEmptyOrders();
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="admin-order-card">
      <div class="order-header">
        <div class="order-info">
          <h4>Order #${order.order_id}</h4>
          <div class="order-date">${formatDate(order.created_at)}</div>
        </div>
        <span class="status status-${order.status}">${order.status}</span>
      </div>
      <div class="order-parties">
        <div class="party-info">
          <h5>Customer</h5>
          <p>${order.customer_name}</p>
          <p>📞 ${order.phone}</p>
        </div>
        <div class="party-info">
          <h5>Restaurant</h5>
          <p>${order.restaurant_name}</p>
          <p>📍 ${order.restaurant_location}</p>
        </div>
      </div>
      <div class="order-total">
        Total: ৳${parseFloat(order.total_amount).toFixed(2)}
      </div>
    </div>
  `).join('');
}

// Show empty orders state
function showEmptyOrders() {
  document.getElementById('recentOrders').innerHTML = `
    <div class="empty-state">
      <h3>📋</h3>
      <p>No recent orders</p>
    </div>
  `;
}

// Approve restaurant
async function approveRestaurant(restaurantId) {
  if (!confirm('Are you sure you want to approve this restaurant?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/approve_restaurant.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ restaurant_id: restaurantId, action: 'approve' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Restaurant approved successfully!');
      loadPendingRestaurants();
      loadStats();
    } else {
      alert(result.message || 'Failed to approve restaurant');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Reject restaurant
async function rejectRestaurant(restaurantId) {
  if (!confirm('Are you sure you want to reject this restaurant? This action cannot be undone.')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/approve_restaurant.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ restaurant_id: restaurantId, action: 'reject' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Restaurant rejected.');
      loadPendingRestaurants();
      loadStats();
    } else {
      alert(result.message || 'Failed to reject restaurant');
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
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

// Logout function
function logout() {
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}