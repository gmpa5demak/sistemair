const STORAGE_KEY = "air-artetis-gpma5-data";
const USER_SESSION_KEY = "air-artetis-user-session";

const fallbackUsers = [
  { id: "u-a01", name: "Budi Santoso", code: "A-01", username: "a01", password: "a01" },
  { id: "u-a02", name: "Siti Aminah", code: "A-02", username: "a02", password: "a02" },
  { id: "u-b03", name: "Agus Prasetyo", code: "B-03", username: "b03", password: "b03" },
];

const form = document.getElementById("user-login-form");
const message = document.getElementById("user-login-message");

function loadUsers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return fallbackUsers;

  try {
    return (JSON.parse(saved).users || []).map((user, index) => ({
      ...user,
      username:
        user.username ||
        String(user.code || `user${index + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      password:
        user.password ||
        String(user.code || `user${index + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
    }));
  } catch {
    return fallbackUsers;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const username = String(data.get("username")).trim();
  const password = String(data.get("password"));
  const user = loadUsers().find((item) => item.username === username && item.password === password);

  if (user) {
    sessionStorage.setItem(USER_SESSION_KEY, user.id);
    message.textContent = "Login berhasil. Membuka halaman user...";
    message.className = "login-message success";
    window.setTimeout(() => {
      window.location.href = "index.html#user";
    }, 450);
    return;
  }

  message.textContent = "Username atau password user salah.";
  message.className = "login-message error";
});
