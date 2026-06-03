const STORAGE_KEY = "air-artetis-gpma5-data";
const ADMIN_SESSION_KEY = "air-artetis-admin-session";
const USER_SESSION_KEY = "air-artetis-user-session";

const initialState = {
  pricePerM3: 2500,
  users: [
    {
      id: "u-a01",
      name: "Budi Santoso",
      code: "A-01",
      block: "Blok A No. 01",
      username: "a01",
      password: "a01",
      profilePhoto: "",
      lastUsage: 12,
      currentUsage: 18,
      monthlyCost: null,
      month: "2026-06",
      userPhoto: "",
      adminPhoto: "",
    },
    {
      id: "u-a02",
      name: "Siti Aminah",
      code: "A-02",
      block: "Blok A No. 02",
      username: "a02",
      password: "a02",
      profilePhoto: "",
      lastUsage: 9,
      currentUsage: 14,
      monthlyCost: null,
      month: "2026-06",
      userPhoto: "",
      adminPhoto: "",
    },
    {
      id: "u-b03",
      name: "Agus Prasetyo",
      code: "B-03",
      block: "Blok B No. 03",
      username: "b03",
      password: "b03",
      profilePhoto: "",
      lastUsage: 15,
      currentUsage: 21,
      monthlyCost: null,
      month: "2026-06",
      userPhoto: "",
      adminPhoto: "",
    },
  ],
};

let state = loadState();
let selectedUserId = state.users[0]?.id || "";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return normalizeState(structuredClone(initialState));

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return normalizeState(structuredClone(initialState));
  }
}

function normalizeState(data) {
  const normalized = {
    pricePerM3: Number(data.pricePerM3 || initialState.pricePerM3),
    users: Array.isArray(data.users) ? data.users : [],
  };

  normalized.users = normalized.users.map((user, index) => ({
    ...user,
    username: user.username || defaultCredential(user, index),
    password: user.password || defaultCredential(user, index),
    profilePhoto: user.profilePhoto || "",
    lastUsage: Number(user.lastUsage || 0),
    currentUsage: Number(user.currentUsage || 0),
    monthlyCost: typeof user.monthlyCost === "number" ? user.monthlyCost : null,
  }));

  return normalized;
}

function defaultCredential(user, index) {
  return String(user.code || `user${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

function getLoggedInUserId() {
  return sessionStorage.getItem(USER_SESSION_KEY);
}

function getLoggedInUser() {
  const userId = getLoggedInUserId();
  return state.users.find((user) => user.id === userId);
}

function calculateUsage(user) {
  return Math.max(Number(user.currentUsage) - Number(user.lastUsage), 0);
}

function calculateBill(user) {
  if (typeof user.monthlyCost === "number" && user.monthlyCost >= 0) {
    return user.monthlyCost;
  }

  return calculateUsage(user) * Number(state.pricePerM3);
}

function saveMeterReading(user, currentMeter, month, monthlyCost, photoData, photoField) {
  const previousMeter = Number(user.currentUsage || 0);

  if (Number.isNaN(currentMeter)) {
    return "Meteran bulan ini tidak valid.";
  }

  if (currentMeter < previousMeter) {
    return "Meteran bulan ini tidak boleh lebih kecil dari meteran bulan lalu.";
  }

  user.lastUsage = previousMeter;
  user.currentUsage = currentMeter;
  user.monthlyCost = monthlyCost;
  user.month = month;

  if (photoData) {
    user[photoField] = photoData;
  }

  return "";
}

function formatM3(value) {
  return `${Number(value || 0).toLocaleString("id-ID")} m3`;
}

function byId(id) {
  return document.getElementById(id);
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderPrice() {
  byId("current-price").textContent = `${rupiah.format(state.pricePerM3)} / m3`;
  byId("price-input").value = state.pricePerM3;
}

function renderUserSelectors() {
  const userSelector = byId("user-selector");
  const usageSelector = document.querySelector("#usage-form select[name='userId']");
  const usageUserSearch = document.querySelector("#usage-form input[name='userSearch']");
  const editSelector = document.querySelector("#admin-edit-user-form select[name='userId']");
  const usageMonth = document.querySelector("#usage-form input[name='month']");
  const options = state.users
    .map((user) => `<option value="${user.id}">${user.code} - ${user.name}</option>`)
    .join("");

  userSelector.innerHTML = options;
  usageSelector.innerHTML = options;
  editSelector.innerHTML = options;

  if (getLoggedInUser()) {
    selectedUserId = getLoggedInUser().id;
    userSelector.style.display = "none";
  } else {
    userSelector.style.display = "";
  }

  if (!state.users.some((user) => user.id === selectedUserId)) {
    selectedUserId = state.users[0]?.id || "";
  }

  userSelector.value = selectedUserId;
  usageSelector.value = selectedUserId;
  filterUsageUsers(usageUserSearch.value);
  editSelector.value = selectedUserId;
  usageMonth.value ||= new Date().toISOString().slice(0, 7);
  updatePreviousMeterNote();
  fillAdminEditForm(selectedUserId);
}

function renderPhoto(target, src) {
  if (!src) {
    target.textContent = "Belum ada foto.";
    return;
  }
  target.innerHTML = `<img src="${src}" alt="Foto meteran air" />`;
}

function renderProfilePhoto(target, src) {
  if (!src) {
    target.textContent = "Foto";
    return;
  }
  target.innerHTML = `<img src="${src}" alt="Foto profil" />`;
}

function renderUserPage() {
  const user = state.users.find((item) => item.id === selectedUserId);
  if (!user) return;

  renderProfilePhoto(byId("user-profile-photo"), user.profilePhoto);
  byId("user-name").textContent = user.name;
  byId("user-code").textContent = user.code;
  byId("user-block").textContent = user.block;
  byId("user-profile-form").elements.name.value = user.name;
  byId("user-profile-form").elements.block.value = user.block;
  byId("user-profile-form").elements.username.value = user.username;
  byId("user-profile-form").elements.password.value = "";
  byId("user-profile-form").elements.profilePhoto.value = "";
  byId("user-last").textContent = formatM3(user.lastUsage);
  byId("user-current").textContent = formatM3(user.currentUsage);
  byId("user-total").textContent = rupiah.format(calculateBill(user));
  byId("user-meter-current").value = "";
  byId("user-meter-current").min = user.currentUsage || 0;
  byId("user-meter-month").value ||= new Date().toISOString().slice(0, 7);
  byId("user-previous-meter-note").textContent = `Meteran bulan lalu otomatis: ${formatM3(user.currentUsage)} dari data terakhir.`;
  renderPhoto(byId("user-photo-preview"), user.userPhoto);
}

function photoCell(src, title) {
  if (!src) return `<div class="thumb-cell">Kosong</div>`;
  return `
    <button class="thumb-cell photo-button" type="button" data-photo-src="${src}" data-photo-title="${excelSafe(title)}">
      <img class="photo-thumb" src="${src}" alt="${excelSafe(title)}" />
    </button>
  `;
}

function getMeterPhoto(user) {
  return user.userPhoto || user.adminPhoto || "";
}

function renderReports() {
  const body = byId("report-body");
  const query = byId("report-search")?.value.trim().toLowerCase() || "";
  const filteredUsers = state.users
    .filter((user) => {
      if (!query) return true;

      return [user.name, user.code, user.block, user.month]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .sort((a, b) => String(a.code).localeCompare(String(b.code), "id-ID", { numeric: true }));

  body.innerHTML = filteredUsers
    .map(
      (user) => `
        <tr>
          <td data-label="Nama">${user.name}</td>
          <td data-label="Kode">${user.code}</td>
          <td data-label="Bulan">${user.month || "-"}</td>
          <td data-label="Lalu">${formatM3(user.lastUsage)}</td>
          <td data-label="Saat Ini">${formatM3(user.currentUsage)}</td>
          <td data-label="Bayar">${rupiah.format(calculateBill(user))}</td>
          <td data-label="Foto Meteran">${photoCell(getMeterPhoto(user), `Foto meteran ${user.name}`)}</td>
        </tr>
      `,
    )
    .join("");

  byId("report-summary").textContent = `${filteredUsers.length} user`;
  byId("export-month").value ||= new Date().toISOString().slice(0, 7);
}

function renderIncomeSummary() {
  const monthInput = byId("income-month");
  monthInput.value ||= new Date().toISOString().slice(0, 7);
  const month = monthInput.value;
  const rows = state.users.filter((user) => !month || user.month === month);
  const totalIncome = rows.reduce((sum, user) => sum + calculateBill(user), 0);
  const totalUsage = rows.reduce((sum, user) => sum + calculateUsage(user), 0);

  byId("income-total").textContent = rupiah.format(totalIncome);
  byId("income-usage").textContent = formatM3(totalUsage);
  byId("income-users").textContent = rows.length.toLocaleString("id-ID");
}

function renderUserList() {
  byId("user-count").textContent = `${state.users.length} warga`;
  byId("user-list").innerHTML = state.users
    .map(
      (user) => `
        <div class="user-row">
          <div class="mini-profile">${user.profilePhoto ? `<img src="${user.profilePhoto}" alt="Foto profil ${excelSafe(user.name)}" />` : "Foto"}</div>
          <div>
            <strong>${user.name}</strong>
            <span>${user.block} | Username: ${user.username}</span>
          </div>
          <span>${user.code}</span>
        </div>
      `,
    )
    .join("");
}

function fillAdminEditForm(userId) {
  const form = byId("admin-edit-user-form");
  const user = state.users.find((item) => item.id === userId);
  if (!form || !user) return;

  form.elements.userId.value = user.id;
  form.elements.name.value = user.name;
  form.elements.code.value = user.code;
  form.elements.block.value = user.block;
  form.elements.username.value = user.username;
  form.elements.password.value = "";
  form.elements.profilePhoto.value = "";
}

function renderAll() {
  renderPrice();
  renderUserSelectors();
  renderUserPage();
  renderReports();
  renderIncomeSummary();
  renderUserList();
}

function showView(viewId) {
  if (viewId === "user" && !getLoggedInUser()) {
    window.location.href = "user-login.html";
    return;
  }

  if (viewId === "admin" && !isAdminLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });
  if (window.location.hash !== `#${viewId}`) {
    history.replaceState(null, "", `#${viewId}`);
  }
}

function updatePreviousMeterNote() {
  const usageSelector = document.querySelector("#usage-form select[name='userId']");
  const note = byId("previous-meter-note");
  if (!usageSelector || !note) return;

  const user = state.users.find((item) => item.id === usageSelector.value);
  if (!user) {
    note.textContent = "Cari lalu pilih user terlebih dahulu. Meteran bulan lalu akan ditarik otomatis dari data terakhir.";
    return;
  }

  note.textContent = `Meteran bulan lalu otomatis: ${formatM3(user.currentUsage)} dari data terakhir ${user.name}.`;
}

function filterUsageUsers(query = "") {
  const usageSelector = document.querySelector("#usage-form select[name='userId']");
  const normalizedQuery = query.trim().toLowerCase();
  const matches = state.users.filter((user) => {
    if (!normalizedQuery) return true;

    return [user.name, user.code, user.block]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  usageSelector.innerHTML = matches
    .map((user) => `<option value="${user.id}">${user.code} - ${user.name} (${user.block})</option>`)
    .join("");

  if (matches.some((user) => user.id === selectedUserId)) {
    usageSelector.value = selectedUserId;
  } else if (matches[0]) {
    selectedUserId = matches[0].id;
    usageSelector.value = matches[0].id;
  }

  updatePreviousMeterNote();
  return matches;
}

function renderHomeResult(user) {
  const result = byId("home-result");
  if (!user) {
    result.className = "result-card empty";
    result.textContent = "Data tidak ditemukan. Coba ketik nama warga atau kode rumah.";
    return;
  }

  result.className = "result-card";
  result.innerHTML = `
    <div class="result-grid">
      <div class="result-item"><span>Nama</span><strong>${user.name}</strong></div>
      <div class="result-item"><span>Blok Rumah</span><strong>${user.block}</strong></div>
      <div class="result-item"><span>Air Bulan Lalu</span><strong>${formatM3(user.lastUsage)}</strong></div>
      <div class="result-item"><span>Air Bulan Saat Ini</span><strong>${formatM3(user.currentUsage)}</strong></div>
      <div class="result-item"><span>Pemakaian</span><strong>${formatM3(calculateUsage(user))}</strong></div>
      <div class="result-item"><span>Tagihan</span><strong>${rupiah.format(calculateBill(user))}</strong></div>
    </div>
    <div class="home-photo-result">
      <span>Foto Meteran</span>
      ${getMeterPhoto(user) ? `<button class="home-photo-button photo-button" type="button" data-photo-src="${getMeterPhoto(user)}" data-photo-title="Foto meteran ${excelSafe(user.name)}"><img src="${getMeterPhoto(user)}" alt="Foto meteran ${excelSafe(user.name)}" /></button>` : `<div class="home-photo-empty">Belum ada foto meteran.</div>`}
    </div>
  `;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isDuplicateValue(field, value, currentUserId) {
  return state.users.some((user) => user.id !== currentUserId && String(user[field]).toLowerCase() === String(value).toLowerCase());
}

async function applyProfileUpdate(user, formData, options = {}) {
  const name = String(formData.get("name")).trim();
  const block = String(formData.get("block")).trim();
  const username = String(formData.get("username")).trim();
  const code = options.allowCode ? String(formData.get("code")).trim().toUpperCase() : user.code;
  const password = String(formData.get("password") || "");
  const photo = formData.get("profilePhoto");

  if (!name || !block || !username || !code) {
    return "Data profil belum lengkap.";
  }

  if (isDuplicateValue("username", username, user.id)) {
    return "Username sudah digunakan user lain.";
  }

  if (options.allowCode && isDuplicateValue("code", code, user.id)) {
    return "Kode rumah sudah digunakan user lain.";
  }

  user.name = name;
  user.block = block;
  user.username = username;
  user.code = code;

  if (password) {
    user.password = password;
  }

  if (photo && photo.size > 0) {
    user.profilePhoto = await readFileAsDataUrl(photo);
  }

  return "";
}

function excelSafe(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exportMonthlyExcel() {
  const month = byId("export-month").value;
  const query = byId("report-search").value.trim().toLowerCase();
  const rows = state.users.filter((user) => {
    const matchesMonth = !month || user.month === month;
    const matchesSearch =
      !query ||
      [user.name, user.code, user.block, user.month]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    return matchesMonth && matchesSearch;
  });

  if (!rows.length) {
    showToast("Tidak ada data untuk bulan yang dipilih.");
    return;
  }

  const total = rows.reduce((sum, user) => sum + calculateBill(user), 0);
  const tableRows = rows
    .map(
      (user) => `
        <tr>
          <td>${excelSafe(user.name)}</td>
          <td>${excelSafe(user.code)}</td>
          <td>${excelSafe(user.block)}</td>
          <td>${excelSafe(user.month || "-")}</td>
          <td>${Number(user.lastUsage || 0)}</td>
          <td>${Number(user.currentUsage || 0)}</td>
          <td>${calculateUsage(user)}</td>
          <td>${calculateBill(user)}</td>
          <td>${getMeterPhoto(user) ? "Ada" : "Kosong"}</td>
        </tr>
      `,
    )
    .join("");
  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <tr><th colspan="9">Laporan Bulanan Air Artetis GPMA 5 RT 14 RW 1</th></tr>
          <tr><th colspan="9">Bulan: ${excelSafe(month || "Semua Bulan")}</th></tr>
          <tr>
            <th>Nama</th>
            <th>Kode Rumah</th>
            <th>Blok Rumah</th>
            <th>Bulan</th>
            <th>Meter Bulan Lalu</th>
            <th>Meter Bulan Ini</th>
            <th>Pemakaian m3</th>
            <th>Tagihan Rp</th>
            <th>Foto Meteran</th>
          </tr>
          ${tableRows}
          <tr>
            <th colspan="7">Total Tagihan</th>
            <th>${total}</th>
            <th></th>
          </tr>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `laporan-air-artetis-${month || "semua-bulan"}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("File Excel laporan bulanan berhasil dibuat.");
}

function openPhotoModal(src, title) {
  byId("photo-modal-image").src = src;
  byId("photo-modal-title").textContent = title || "Foto meteran";
  byId("photo-modal").classList.add("show");
  byId("photo-modal").setAttribute("aria-hidden", "false");
}

function closePhotoModal() {
  byId("photo-modal").classList.remove("show");
  byId("photo-modal").setAttribute("aria-hidden", "true");
  byId("photo-modal-image").src = "";
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

byId("admin-logout").addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showToast("Sesi admin sudah keluar.");
  showView("home");
});

byId("user-logout").addEventListener("click", () => {
  sessionStorage.removeItem(USER_SESSION_KEY);
  selectedUserId = state.users[0]?.id || "";
  showToast("Sesi user sudah keluar.");
  renderAll();
  showView("home");
});

document.querySelector("#usage-form input[name='userSearch']").addEventListener("input", (event) => {
  filterUsageUsers(event.target.value);
});
document.querySelector("#usage-form select[name='userId']").addEventListener("change", (event) => {
  selectedUserId = event.target.value;
  updatePreviousMeterNote();
});
byId("export-excel").addEventListener("click", exportMonthlyExcel);
byId("income-month").addEventListener("change", renderIncomeSummary);
byId("report-search").addEventListener("input", renderReports);
byId("close-photo-modal").addEventListener("click", closePhotoModal);
byId("photo-modal").addEventListener("click", (event) => {
  if (event.target.id === "photo-modal") closePhotoModal();
});
byId("report-body").addEventListener("click", (event) => {
  const button = event.target.closest(".photo-button");
  if (!button) return;
  openPhotoModal(button.dataset.photoSrc, button.dataset.photoTitle);
});

byId("home-result").addEventListener("click", (event) => {
  const button = event.target.closest(".photo-button");
  if (!button) return;
  openPhotoModal(button.dataset.photoSrc, button.dataset.photoTitle);
});

byId("home-search-button").addEventListener("click", () => {
  const query = byId("home-search").value.trim().toLowerCase();
  const user = state.users.find((item) => item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query));
  renderHomeResult(user);
});

byId("home-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    byId("home-search-button").click();
  }
});

byId("user-selector").addEventListener("change", (event) => {
  if (getLoggedInUser()) return;
  selectedUserId = event.target.value;
  renderUserPage();
});

byId("user-profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = state.users.find((item) => item.id === selectedUserId);
  if (!user) return;

  const error = await applyProfileUpdate(user, new FormData(event.currentTarget));
  if (error) {
    showToast(error);
    return;
  }

  saveState();
  renderAll();
  showToast("Profil user berhasil diperbarui.");
});

byId("user-meter-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const user = state.users.find((item) => item.id === selectedUserId);
  if (!user) return;

  const photo = form.get("userPhoto");
  const photoData = photo && photo.size > 0 ? await readFileAsDataUrl(photo) : "";
  const error = saveMeterReading(
    user,
    Number(form.get("currentUsage")),
    String(form.get("month")),
    null,
    photoData,
    "userPhoto",
  );

  if (error) {
    showToast(error);
    return;
  }

  saveState();
  event.currentTarget.reset();
  renderAll();
  showToast("Data meteran user berhasil disimpan.");
});

byId("save-price").addEventListener("click", () => {
  const value = Number(byId("price-input").value);
  if (value < 0 || Number.isNaN(value)) {
    showToast("Harga air tidak valid.");
    return;
  }

  state.pricePerM3 = value;
  saveState();
  renderAll();
  showToast("Harga air per m3 berhasil diperbarui.");
});

byId("create-user-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const code = String(form.get("code")).trim().toUpperCase();
  const username = String(form.get("username")).trim();

  if (state.users.some((user) => user.code.toUpperCase() === code)) {
    showToast("Kode rumah sudah digunakan.");
    return;
  }

  if (state.users.some((user) => user.username === username)) {
    showToast("Username user sudah digunakan.");
    return;
  }

  const user = {
    id: `u-${Date.now()}`,
    name: String(form.get("name")).trim(),
    code,
    block: String(form.get("block")).trim(),
    username,
    password: String(form.get("password")),
    profilePhoto: "",
    lastUsage: 0,
    currentUsage: 0,
    monthlyCost: null,
    month: new Date().toISOString().slice(0, 7),
    userPhoto: "",
    adminPhoto: "",
  };

  state.users.push(user);
  selectedUserId = user.id;
  saveState();
  renderAll();
  event.currentTarget.reset();
  showToast("Akun user baru berhasil dibuat.");
});

document.querySelector("#admin-edit-user-form select[name='userId']").addEventListener("change", (event) => {
  selectedUserId = event.target.value;
  fillAdminEditForm(event.target.value);
});

byId("admin-edit-user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const user = state.users.find((item) => item.id === formData.get("userId"));
  if (!user) return;

  const error = await applyProfileUpdate(user, formData, { allowCode: true });
  if (error) {
    showToast(error);
    return;
  }

  selectedUserId = user.id;
  saveState();
  renderAll();
  showToast("Data user berhasil diedit.");
});

byId("delete-user").addEventListener("click", () => {
  const form = byId("admin-edit-user-form");
  const user = state.users.find((item) => item.id === form.elements.userId.value);
  if (!user) return;

  const approved = window.confirm(`Hapus user ${user.name} karena sudah pindah rumah?`);
  if (!approved) return;

  state.users = state.users.filter((item) => item.id !== user.id);
  if (getLoggedInUserId() === user.id) {
    sessionStorage.removeItem(USER_SESSION_KEY);
  }

  selectedUserId = state.users[0]?.id || "";
  saveState();
  renderAll();
  showView("admin");
  showToast("User berhasil dihapus.");
});

byId("usage-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const user = state.users.find((item) => item.id === form.get("userId"));
  if (!user) {
    showToast("Cari lalu pilih user terlebih dahulu.");
    return;
  }

  const monthlyCost = String(form.get("monthlyCost")).trim();
  const photo = form.get("adminPhoto");
  const photoData = photo && photo.size > 0 ? await readFileAsDataUrl(photo) : "";
  const cost = monthlyCost === "" ? null : Number(monthlyCost);
  const error = saveMeterReading(
    user,
    Number(form.get("currentUsage")),
    String(form.get("month")),
    Number.isNaN(cost) ? null : cost,
    photoData,
    "adminPhoto",
  );

  if (error) {
    showToast(error);
    return;
  }

  selectedUserId = user.id;
  saveState();
  renderAll();
  showToast("Data pemakaian bulanan berhasil disimpan.");
});

renderAll();
const initialView = ["#home", "#user", "#admin"].includes(window.location.hash) ? window.location.hash.slice(1) : "home";
showView(initialView);
