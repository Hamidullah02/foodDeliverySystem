const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'restaurant') {
  window.location.href = "../login.html";
}

// Global variables
let restaurantData = null;
let orders = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadRestaurantInfo();
});

// Load restaurant information
async function loadRestaurantInfo() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/info.php?owner_id=${userData.user_id}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      restaurantData = result.data;
      if (restaurantData.status === 'approved') {
        loadOrders();
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

// Load orders
async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE}/restaurant/manage_orders.php?restaurant_id=${restaurantData.restaurant_id}`);
    const result = await response.json();
    
    if (result.success) {
      orders = result.data;
      updateOrderStats();
      displayOrders(filterOrdersByStatus(currentFilter));
    } else {
      showEmptyOrders();
    }
  } catch (error) {
    showError("Failed to load orders");
  }
}

// Update order statistics
function updateOrderStats() {
  const pendingCount = orders.filter(order => order.status === 'pending').length;
  const preparingCount = orders.filter(order => order.status === 'preparing').length;
  const deliveredToday = orders.filter(order => {
    const orderDate = new Date(order.created_at).toDateString();
    const today = new Date().toDateString();
    return order.status === 'delivered' && orderDate === today;
  }).length;
  
  document.getElementById('pendingCount').textContent = pendingCount;
  document.getElementById('preparingCount').textContent = preparingCount;
  document.getElementById('deliveredCount').textContent = deliveredToday;
}

// Filter orders by status
function filterOrders(status) {
  currentFilter = status;
  
  // Update active filter button
  document.querySelectorAll('.category-pill').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const filteredOrders = filterOrdersByStatus(status);
  displayOrders(filteredOrders);
}

// Helper function to filter orders
function filterOrdersByStatus(status) {
  if (status === 'all') {
    return orders;
  }
  return orders.filter(order => order.status === status);
}

// Display orders
function displayOrders(orderList) {
  const container = document.getElementById('ordersContainer');
  
  if (orderList.length === 0) {
    const message = currentFilter === 'all' ? 
      "No orders yet." : 
      `No ${currentFilter} orders.`;
    
    container.innerHTML = `
      <div class="empty-state">
        <h3>📋</h3>
        <p>${message}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = orderList.map(order => `
    <div class="order-card">
      <div class="order-header">
        <div class="order-info">
          <h4>Order #${order.order_id}</h4>
          <div class="order-date">${formatDate(order.created_at)}</div>
        </div>
        <span class="status status-${order.status}">${order.status}</span>
      </div>
      
      <div class="order-customer-info">
        <h5>Customer Information</h5>
        <div class="customer-details">
          <div><strong>Name:</strong> ${order.customer_name}</div>
          <div><strong>Phone:</strong> ${order.phone}</div>
          <div><strong>Address:</strong> ${order.delivery_address}</div>
        </div>
      </div>
      
      <div class="order-items">
        <h5>Order Items</h5>
        ${order.items.map(item => `
          <div class="order-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>৳${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="order-total">
        Total: ৳${parseFloat(order.total_amount).toFixed(2)}
      </div>
      
      ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
        <div class="status-actions">
          <select onchange="updateOrderStatus(${order.order_id}, this.value)">
            <option value="">Update Status</option>
            ${order.status === 'pending' ? '<option value="preparing">Mark as Preparing</option>' : ''}
            ${order.status === 'preparing' ? '<option value="delivered">Mark as Delivered</option>' : ''}
            <option value="cancelled">Cancel Order</option>
          </select>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  if (!newStatus) return;
  
  const confirmMessage = `Are you sure you want to mark this order as ${newStatus}?`;
  if (!confirm(confirmMessage)) return;
  
  try {
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('status', newStatus);
    
    const response = await fetch(`${API_BASE}/restaurant/update_order_status.php`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Order status updated to ${newStatus}`);
      loadOrders(); // Reload orders to show updated status
    } else {
      alert(result.message || 'Failed to update order status');
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

// Show states
function showRestaurantNotApproved() {
  document.getElementById('ordersContainer').innerHTML = `
    <div class="empty-state">
      <h3>⏳</h3>
      <p>Your restaurant is still pending approval.</p>
      <p>You can manage orders once it's approved by admin.</p>
    </div>
  `;
}

function showNoRestaurant() {
  document.getElementById('ordersContainer').innerHTML = `
    <div class="empty-state">
      <h3>🏪</h3>
      <p>Please set up your restaurant first.</p>
      <a href="restaurant_setup.html" class="btn-primary">Setup Restaurant</a>
    </div>
  `;
}

function showEmptyOrders() {
  document.getElementById('ordersContainer').innerHTML = `
    <div class="empty-state">
      <h3>📋</h3>
      <p>No orders received yet.</p>
      <p>Orders will appear here once customers start placing them.</p>
    </div>
  `;
}

function showError(message) {
  document.getElementById('ordersContainer').innerHTML = `
    <div class="empty-state">
      <h3>❌</h3>
      <p>${message}</p>
      <button onclick="loadOrders()" class="btn-primary">Try Again</button>
    </div>
  `;
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  window.location.href = '../index.html';
}