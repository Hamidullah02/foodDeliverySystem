const API_BASE = "http://localhost/khudalagse/backend";
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'admin') window.location.href = "../login.html";

document.addEventListener("DOMContentLoaded", () => loadRestaurants());

async function loadRestaurants() {
  const res = await fetch(`${API_BASE}/admin/restaurants.php`);
  const result = await res.json();
  const c = document.getElementById("restaurantsList");
  if (!result.success || result.data.length === 0) {
    c.innerHTML = "<p>No restaurants found.</p>"; return;
  }
  c.innerHTML = `<table>
    <tr><th>ID</th><th>Name</th><th>Owner</th><th>Status</th><th>Actions</th></tr>
    ${result.data.map(r=>`
      <tr>
        <td>${r.restaurant_id}</td>
        <td>${r.name}</td>
        <td>${r.owner_name}</td>
        <td>${r.status}</td>
        <td>
          ${r.status==='pending'
            ? `<button onclick="updateRestaurant(${r.restaurant_id},'approve')">Approve</button>
               <button onclick="updateRestaurant(${r.restaurant_id},'reject')">Reject</button>`:''
          }
          <button onclick="editRestaurant(${r.restaurant_id},
            '${r.name}','${r.location||""}','${r.description||""}')">Edit</button>
        </td>
      </tr>`).join('')}
  </table>`;
}

async function updateRestaurant(id, action) {
  await fetch(`${API_BASE}/admin/restaurants.php`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({restaurant_id:id,action})
  });
  loadRestaurants();
}

async function editRestaurant(id, oldName, oldLoc, oldDesc) {
  const name = prompt("New name:", oldName) || oldName;
  const location = prompt("New location:", oldLoc) || oldLoc;
  const description = prompt("New description:", oldDesc) || oldDesc;

  await fetch(`${API_BASE}/admin/restaurants.php`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({restaurant_id:id,action:"update",name,location,description})
  });
  loadRestaurants();
}


function logout() {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

