const API_BASE = "http://localhost/khudalagse/backend";

// Check authentication
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'customer') {
  window.location.href = "../login.html";
}

// Global variables
let cart = [];
const DELIVERY_FEE = 50;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  setupCheckoutForm();
});

// Load cart from localStorage
function loadCart() {
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  displayCart();
  updateCartCount();
  updateSummary();
}

// Display cart items
function displayCart() {
  const container = document.getElementById('cartItems');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        <h3>🛒</h3>
        <p>Your cart is empty</p>
        <a href="customer_dashboard.html" class="btn-primary">Browse Restaurants</a>
      </div>
    `;
    return;
  }
  
  // Group items by restaurant
  const groupedCart = groupCartByRestaurant();
  
  container.innerHTML = Object.entries(groupedCart).map(([restaurantId, items]) => `
    <div class="restaurant-group">
      <h4>Restaurant ID: ${restaurantId}</h4>
      ${items.map(item => `
        <div class="cart-item">
        <img src="${item.image_url || '../default.png'}" alt="${item.name}" class="cart-item-img" />
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="cart-item-price">৳${parseFloat(item.price).toFixed(2)} each</div>
          </div>
          <div class="cart-item-controls">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="updateQuantity(${item.menu_item_id}, ${item.quantity - 1})">-</button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="quantity-btn" onclick="updateQuantity(${item.menu_item_id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="item-total">৳${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
            <button class="btn-danger" onclick="removeItem(${item.menu_item_id})">Remove</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// Group cart items by restaurant
function groupCartByRestaurant() {
  const grouped = {};
  cart.forEach(item => {
    if (!grouped[item.restaurant_id]) {
      grouped[item.restaurant_id] = [];
    }
    grouped[item.restaurant_id].push(item);
  });
  return grouped;
}

// Update item quantity
function updateQuantity(menuItemId, newQuantity) {
  if (newQuantity <= 0) {
    removeItem(menuItemId);
    return;
  }
  
  const itemIndex = cart.findIndex(item => item.menu_item_id == menuItemId);
  if (itemIndex >= 0) {
    cart[itemIndex].quantity = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    updateCartCount();
    updateSummary();
  }
}

// Remove item from cart
function removeItem(menuItemId) {
  cart = cart.filter(item => item.menu_item_id != menuItemId);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
  updateCartCount();
  updateSummary();
}

// Update cart count
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

// Update order summary
function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const deliveryFee = cart.length > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  
  document.getElementById('subtotal').textContent = `৳${subtotal.toFixed(2)}`;
  document.getElementById('deliveryFee').textContent = `৳${deliveryFee.toFixed(2)}`;
  document.getElementById('total').textContent = `৳${total.toFixed(2)}`;
  
  // Show/hide checkout form
  const checkoutForm = document.getElementById('checkoutForm');
  if (cart.length === 0) {
    checkoutForm.style.display = 'none';
  } else {
    checkoutForm.style.display = 'block';
  }
}

// Setup checkout form
function setupCheckoutForm() {
  document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Validate single restaurant
    const restaurants = [...new Set(cart.map(item => item.restaurant_id))];
    if (restaurants.length > 1) {
      alert('You can only order from one restaurant at a time. Please remove items from other restaurants.');
      return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.checkout-text');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading state
    btnText.classList.add('hidden');
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const formData = new FormData(e.target);
    const orderData = {
      customer_id: userData.user_id,
      restaurant_id: restaurants[0],
      delivery_address: formData.get('delivery_address'),
      phone: formData.get('phone'),
      items: cart,
      total_amount: cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0) + DELIVERY_FEE
    };

    try {
      const response = await fetch(`${API_BASE}/customer/place_order.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Order placed successfully!');
        localStorage.removeItem('cart');
        window.location.href = 'orders.html';
      } else {
        alert(result.message || 'Failed to place order');
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

// Logout function
function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '../index.html';
}