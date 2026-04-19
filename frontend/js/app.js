const API = "http://localhost:5000/api";

// ===== PAGE NAVIGATION =====
function navigateTo(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
  const titles = { dashboard: "Dashboard", employees: "Employees", add: "Add Employee" };
  document.getElementById("pageTitle").textContent = titles[page] || page;
  if (page === "dashboard") loadDashboard();
  if (page === "employees") loadEmployees();
  if (page === "add" && !document.getElementById("empId").value) resetForm();
}

document.querySelectorAll("[data-page]").forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    const page = el.dataset.page;
    navigateTo(page);
  });
});

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [stats, emps] = await Promise.all([
      fetch(API + "/stats").then(r => r.json()),
      fetch(API + "/employees").then(r => r.json())
    ]);
    document.getElementById("statTotal").textContent = stats.total;
    document.getElementById("statDepts").textContent = stats.departments;
    document.getElementById("statSalary").textContent = "₹" + Number(stats.avg_salary).toLocaleString("en-IN");

    const recent = emps.slice(0, 5);
    const tbody = document.getElementById("dashTableBody");
    tbody.innerHTML = recent.length ? recent.map(e => `
      <tr>
        <td><strong>${escHtml(e.name)}</strong></td>
        <td>${escHtml(e.role)}</td>
        <td><span class="badge">${escHtml(e.department)}</span></td>
        <td class="salary-val">₹${Number(e.salary).toLocaleString("en-IN")}</td>
        <td class="date-val">${formatDate(e.join_date)}</td>
      </tr>
    `).join("") : `<tr><td colspan="5" class="loading-row">No employees yet.</td></tr>`;
  } catch {
    showConnectionError();
  }
}

// ===== EMPLOYEE LIST =====
let allEmployees = [];

async function loadEmployees() {
  const search = document.getElementById("searchInput").value;
  const dept = document.getElementById("deptFilter").value;
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (dept) params.append("department", dept);

  try {
    const emps = await fetch(`${API}/employees?${params}`).then(r => r.json());
    allEmployees = emps;
    renderEmployees(emps);
    await loadDeptFilter();
  } catch {
    showConnectionError();
  }
}

function renderEmployees(emps) {
  const tbody = document.getElementById("empTableBody");
  document.getElementById("recordCount").textContent = `${emps.length} record${emps.length !== 1 ? "s" : ""} found`;
  tbody.innerHTML = emps.length ? emps.map((e, i) => `
    <tr>
      <td class="row-num">${String(i + 1).padStart(2, "0")}</td>
      <td><strong>${escHtml(e.name)}</strong><br><small style="color:var(--text-muted)">${escHtml(e.email)}</small></td>
      <td>${escHtml(e.email)}</td>
      <td><span class="badge">${escHtml(e.department)}</span></td>
      <td>${escHtml(e.role)}</td>
      <td class="salary-val">₹${Number(e.salary).toLocaleString("en-IN")}</td>
      <td class="date-val">${formatDate(e.join_date)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="editEmployee(${e.id})">Edit</button>
          <button class="btn-del" onclick="confirmDelete(${e.id}, '${escHtml(e.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="8" class="loading-row">No employees found.</td></tr>`;
}

async function loadDeptFilter() {
  try {
    const depts = await fetch(API + "/departments").then(r => r.json());
    const sel = document.getElementById("deptFilter");
    const current = sel.value;
    sel.innerHTML = `<option value="">All Departments</option>` +
      depts.map(d => `<option value="${escHtml(d)}" ${d === current ? "selected" : ""}>${escHtml(d)}</option>`).join("");
  } catch {}
}

// Search / filter events
document.getElementById("searchInput").addEventListener("input", debounce(loadEmployees, 300));
document.getElementById("deptFilter").addEventListener("change", loadEmployees);

// ===== ADD / EDIT FORM =====
function resetForm() {
  document.getElementById("empId").value = "";
  document.getElementById("empForm").reset();
  document.getElementById("formTitle").textContent = "Add New Employee";
  document.getElementById("submitBtn").textContent = "Save Employee";
  hideMsg();
}

async function editEmployee(id) {
  try {
    const emp = await fetch(`${API}/employees/${id}`).then(r => r.json());
    document.getElementById("empId").value = emp.id;
    document.getElementById("fName").value = emp.name;
    document.getElementById("fEmail").value = emp.email;
    document.getElementById("fPhone").value = emp.phone || "";
    document.getElementById("fDept").value = emp.department;
    document.getElementById("fRole").value = emp.role;
    document.getElementById("fSalary").value = emp.salary;
    document.getElementById("fJoinDate").value = emp.join_date;
    document.getElementById("formTitle").textContent = "Edit Employee";
    document.getElementById("submitBtn").textContent = "Update Employee";
    hideMsg();
    navigateTo("add");
  } catch {
    alert("Failed to load employee details.");
  }
}

document.getElementById("empForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const id = document.getElementById("empId").value;
  const payload = {
    name: document.getElementById("fName").value.trim(),
    email: document.getElementById("fEmail").value.trim(),
    phone: document.getElementById("fPhone").value.trim(),
    department: document.getElementById("fDept").value.trim(),
    role: document.getElementById("fRole").value.trim(),
    salary: parseFloat(document.getElementById("fSalary").value),
    join_date: document.getElementById("fJoinDate").value,
  };
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  try {
    const url = id ? `${API}/employees/${id}` : `${API}/employees`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(id ? "Employee updated successfully!" : "Employee added successfully!", "success");
      if (!id) document.getElementById("empForm").reset();
      document.getElementById("empId").value = "";
      document.getElementById("formTitle").textContent = "Add New Employee";
      document.getElementById("submitBtn").textContent = "Save Employee";
    } else {
      showMsg(data.error || "Something went wrong.", "error");
    }
  } catch {
    showMsg("Cannot connect to backend. Is the server running?", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = document.getElementById("empId").value ? "Update Employee" : "Save Employee";
  }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  resetForm();
  navigateTo("employees");
});

// ===== DELETE =====
let deleteTargetId = null;

function confirmDelete(id, name) {
  deleteTargetId = id;
  document.getElementById("modalText").textContent = `Delete "${name}"? This cannot be undone.`;
  document.getElementById("modalOverlay").classList.add("show");
}

document.getElementById("modalCancel").addEventListener("click", () => {
  document.getElementById("modalOverlay").classList.remove("show");
  deleteTargetId = null;
});

document.getElementById("modalConfirm").addEventListener("click", async () => {
  if (!deleteTargetId) return;
  try {
    await fetch(`${API}/employees/${deleteTargetId}`, { method: "DELETE" });
    document.getElementById("modalOverlay").classList.remove("show");
    deleteTargetId = null;
    loadEmployees();
  } catch {
    alert("Failed to delete. Is the server running?");
  }
});

document.getElementById("modalOverlay").addEventListener("click", function(e) {
  if (e.target === this) this.classList.remove("show");
});

// ===== UTILS =====
function escHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function formatDate(d) {
  if (!d) return "—";
  const parts = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parts[2]} ${months[parseInt(parts[1])-1]} ${parts[0]}`;
}
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function showMsg(msg, type) {
  const el = document.getElementById("formMsg");
  el.textContent = msg;
  el.className = "form-msg " + type;
}
function hideMsg() {
  document.getElementById("formMsg").className = "form-msg";
}
function showConnectionError() {
  document.getElementById("statTotal").textContent = "—";
  document.getElementById("statDepts").textContent = "—";
  document.getElementById("statSalary").textContent = "—";
  document.getElementById("dashTableBody").innerHTML =
    `<tr><td colspan="5" class="loading-row" style="color:var(--danger)">⚠ Cannot connect to backend. Start the Flask server.</td></tr>`;
  document.querySelector(".status-dot").style.background = "var(--danger)";
  document.querySelector(".status-text").textContent = "Backend Offline";
}

// ===== INIT =====
loadDashboard();
