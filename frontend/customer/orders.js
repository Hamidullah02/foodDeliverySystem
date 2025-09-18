const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'customer') {
  window.location.href = "../login.html";
}

// Global variables
let orders = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadOrders();
  updateCartCount();
});

// Load customer orders
async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE}/customer/orders.php?customer_id=${userData.user_id}`);
    const result = await response.json();
    
    if (result.success) {
      orders = result.data;
      displayOrders();
    } else {
      showEmptyOrders();
    }
  } catch (error) {
    showEmptyOrders();
  }
}

// Display orders
function displayOrders() {
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
          <div class="restaurant-name">🏪 ${order.restaurant_name}</div>
        </div>
        <div class="order-status">
          <span class="status status-${order.status}">${order.status}</span>
        </div>
      </div>
      
      <div class="order-items">
        ${order.items.map(item => `
          <div class="order-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>৳${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="order-details">
        <div><strong>Delivery Address:</strong> ${order.delivery_address}</div>
        <div><strong>Phone:</strong> ${order.phone}</div>
      </div>
      
      <div class="order-total">
        Total: ৳${parseFloat(order.total_amount).toFixed(2)}
      </div>
    </div>
  `).join('');
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

// Show empty orders state
function showEmptyOrders() {
  document.getElementById('ordersContainer').innerHTML = `
    <div class="empty-message">
      <h3>📋</h3>
      <p>You haven't placed any orders yet</p>
      <a href="customer_dashboard.html" class="btn-primary">Browse Restaurants</a>
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