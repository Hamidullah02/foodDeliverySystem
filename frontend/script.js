const API_BASE = "http://localhost/khudalagse/backend/auth";

const redirectUser = (role, isNewUser = false) => {
  switch(role) {
    case 'customer':
      window.location.href = "customer/customer_dashboard.html";
      break;
    case 'restaurant':
      if (isNewUser) {
        window.location.href = "restaurant/restaurant_setup.html";
      } else {
        window.location.href = "restaurant/owner_dashboard.html";
      }
      break;
    case 'admin':
      window.location.href = "admin/admin_dashboard.html";
      break;
    default:
      window.location.href = "index.html";
  }
};

// Signup
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.signup-text');
  const loading = submitBtn.querySelector('.loading');

  btnText.classList.add('hidden');
  loading.classList.remove('hidden');
  submitBtn.disabled = true;

  const formData = new FormData(e.target);

  try {
    const response = await fetch(`${API_BASE}/register.php`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    alert(result.message);

    if (result.success) {
      // Save only necessary info
      localStorage.setItem("user", JSON.stringify({
        user_id: result.id,
        role: result.role,
        name: result.name,
        email: result.email
      }));
      const role = result.role;
      const isNewUser = role === 'restaurant';
      redirectUser(role, isNewUser);
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Network error. Please try again.");
  } finally {
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

// Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.login-text');
  const loading = submitBtn.querySelector('.loading');

  btnText.classList.add('hidden');
  loading.classList.remove('hidden');
  submitBtn.disabled = true;

  const formData = new FormData(e.target);

  try {
    const response = await fetch(`${API_BASE}/login.php`, {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    if (result.success) {
      localStorage.setItem("user", JSON.stringify(result));
      alert("Login successful!");
      redirectUser(result.role, false);
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Network error. Please try again.");
  } finally {
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
    submitBtn.disabled = false;
  }
});
