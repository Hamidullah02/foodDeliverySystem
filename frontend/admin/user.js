const API_BASE = "http://localhost/khudalagse/backend";

const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || userData.role !== 'admin') {
  window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
});

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/users.php`);
    const result = await res.json();
    if (result.success) {
      displayUsers(result.data);
    } else {
      document.getElementById("usersList").innerHTML = "<p>No users found.</p>";
    }
  } catch {
    document.getElementById("usersList").innerHTML = "<p>Error loading users.</p>";
  }
}

function displayUsers(users) {
  const container = document.getElementById("usersList");
  container.innerHTML = `
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.user_id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td><button class="btn-danger" onclick="deleteUser(${u.user_id})">Delete</button></td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;
}

async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  try {
    const res = await fetch(`${API_BASE}/admin/delete_user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id })
    });
    const result = await res.json();
    alert(result.message);
    loadUsers();
  } catch {
    alert("Error deleting user.");
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}
