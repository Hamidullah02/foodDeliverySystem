const API_BASE = "http://localhost/khudalagse/backend";
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'restaurant') window.location.href = "../login.html";

let restaurantData = null;
let menuItems = [];
let categories = new Set();
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadRestaurantInfo();
    setupForm();
});

async function loadRestaurantInfo() {
    try {
        const res = await fetch(`${API_BASE}/restaurant/info.php?owner_id=${userData.user_id}`);
        const result = await res.json();
        if (result.success && result.data) {
            restaurantData = result.data;
            restaurantData.status === 'approved' ? loadMenuItems() : showNotApproved();
        } else showNoRestaurant();
    } catch (e) {
        showError("Failed to load restaurant info");
    }
}

async function loadMenuItems() {
    try {
        const res = await fetch(`${API_BASE}/restaurant/menu_items.php?restaurant_id=${restaurantData.restaurant_id}`);
        const result = await res.json();
        menuItems = result.success ? result.data : [];
        extractCategories();
        displayCategoryFilters();
        displayMenuItems(menuItems);
    } catch (e) {
        showError("Failed to load menu items");
    }
}

function extractCategories() {
    categories.clear();
    categories.add('all');
    menuItems.forEach(i => categories.add(i.category));
}

function displayCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = Array.from(categories).map(cat => {
        const active = cat === currentFilter ? 'active' : '';
        const name = cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1);
        return `<button class="category-pill ${active}" onclick="filterMenuItems('${cat}')">${name}</button>`;
    }).join('');
}

function filterMenuItems(cat) {
    currentFilter = cat;
    displayCategoryFilters();
    const items = cat === 'all' ? menuItems : menuItems.filter(i => i.category === cat);
    displayMenuItems(items);
}

function displayMenuItems(items) {
    const c = document.getElementById('menuItemsContainer');
    if (items.length === 0) {
        const msg = currentFilter === 'all' ? "No menu items yet" : "No items in " + currentFilter;
        c.innerHTML = `<div class="empty-state"><h3>🍽️</h3><p>${msg}</p><button onclick="showAddItemModal()" class="btn-primary">Add Menu Item</button></div>`;
        return;
    }
    c.innerHTML = items.map(i => `
    <div class="menu-item-card">
<div class="menu-item-image">
    <img src="${i.image_url ? '../../backend/' + i.image_url : '../default.png'}" alt="${i.name}">
</div>
      <div class="menu-item-info">
        <h4>${i.name}</h4>
        <div>${i.category}</div>
        <div>${i.description || 'No description'}</div>
        <div>৳${parseFloat(i.price).toFixed(2)}</div>
        <div class="${i.is_available==1?'available':'unavailable'}">${i.is_available==1?'✅ Available':'❌ Unavailable'}</div>
      </div>
      <div class="menu-item-actions">
        <button onclick="editMenuItem(${i.menu_item_id})" class="btn-secondary">Edit</button>
        <button onclick="toggleAvailability(${i.menu_item_id},${i.is_available})" class="btn-warning">${i.is_available==1?'Disable':'Enable'}</button>
        <button onclick="deleteMenuItem(${i.menu_item_id})" class="btn-danger">Delete</button>
      </div>
    </div>`).join('');
}

function showAddItemModal() {
    if (!restaurantData || restaurantData.status !== 'approved') {
        alert("Restaurant must be approved.");
        return;
    }
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    const form = document.getElementById('menuItemForm');
    form.reset();
    form.menu_item_id.value = '';
    document.getElementById('availabilityToggle').checked = true;
    document.getElementById('menuItemModal').style.display = 'block';
}

function editMenuItem(id) {
    const item = menuItems.find(i => i.menu_item_id == id);
    if (!item) return;
    const form = document.getElementById('menuItemForm');
    form.menu_item_id.value = item.menu_item_id;
    form.name.value = item.name;
    form.description.value = item.description || '';
    form.price.value = item.price;
    form.category.value = item.category;
    form.is_available.checked = item.is_available == 1;
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuItemModal').style.display = 'block';
}

async function toggleAvailability(id, status) {
    const fd = new FormData();
    fd.append('menu_item_id', id);
    fd.append('is_available', status == 1 ? 0 : 1);
    fd.append('action', 'toggle_availability');
    const res = await fetch(`${API_BASE}/restaurant/menu_items.php`, {
        method: 'POST',
        body: fd
    });
    const result = await res.json();
    if (result.success) loadMenuItems();
    else alert(result.message);
}

async function deleteMenuItem(id) {
    if (!confirm("Are you sure?")) return;
    const fd = new FormData();
    fd.append('menu_item_id', id);
    fd.append('action', 'delete');
    const res = await fetch(`${API_BASE}/restaurant/menu_items.php`, {
        method: 'POST',
        body: fd
    });
    const result = await res.json();
    if (result.success) {
        alert("Deleted");
        loadMenuItems();
    } else alert(result.message);
}

function setupForm() {
    const form = document.getElementById('menuItemForm');
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.save-text');
        const loading = submitBtn.querySelector('.loading');
        btnText.classList.add('hidden');
        loading.classList.remove('hidden');
        submitBtn.disabled = true;

        const formData = new FormData(form);
        formData.append('restaurant_id', restaurantData.restaurant_id);
        formData.append('is_available', document.getElementById('availabilityToggle').checked ? 1 : 0);

        const isEdit = form.menu_item_id.value;
        formData.append('action', isEdit ? 'update' : 'create');

        // Get image file input
        const imageInput = document.getElementById('imageInput');
        if (imageInput && imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }

        try {
            const res = await fetch(`${API_BASE}/restaurant/menu_items.php`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                alert(isEdit ? 'Updated' : 'Added');
                closeModal();
                loadMenuItems();
            } else {
                alert(result.message || 'Failed');
            }
        } catch (e) {
            alert('Network error. Make sure your backend URL is correct and the server allows file uploads.');
        } finally {
            btnText.classList.remove('hidden');
            loading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });
}


function closeModal() {
    document.getElementById('menuItemModal').style.display = 'none';
}

function showNotApproved() {
    document.getElementById('menuItemsContainer').innerHTML = '<p>Restaurant pending approval.</p>';
}

function showNoRestaurant() {
    document.getElementById('menuItemsContainer').innerHTML = '<p>No restaurant setup yet.</p>';
}

function showError(msg) {
    document.getElementById('menuItemsContainer').innerHTML = `<p>${msg}</p>`;
}