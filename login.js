const ADMIN_SESSION_KEY = "air-artetis-admin-session";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Gmpa5demak";

const form = document.getElementById("admin-login-form");
const message = document.getElementById("login-message");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const username = String(data.get("username")).trim();
  const password = String(data.get("password"));

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
    message.textContent = "Login berhasil. Membuka halaman admin...";
    message.className = "login-message success";
    window.setTimeout(() => {
      window.location.href = "index.html#admin";
    }, 450);
    return;
  }

  message.textContent = "User atau password admin salah.";
  message.className = "login-message error";
});
