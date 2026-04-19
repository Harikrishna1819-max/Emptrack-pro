# Employee Database Management System 🏢

A full-stack web application to manage employee records with **Add, View, Update, and Delete** (CRUD) operations.

Built with:
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Python Flask (REST API)
- **Database**: SQLite (built-in, no setup needed)

---

## 📸 Features

- 📊 **Dashboard** — Stats: total employees, departments, average salary
- 👥 **Employee List** — Search by name/email/role, filter by department
- ➕ **Add Employee** — Form with validation
- ✏️ **Edit Employee** — Update any record inline
- 🗑️ **Delete Employee** — Confirmation modal before deleting
- 🔌 **REST API** — Clean endpoints, easy to extend

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/employee-dbms.git
cd employee-dbms
```

### 2. Start the Backend
```bash
cd backend
pip install flask flask-cors
python app.py
```
Server runs at: `http://localhost:5000`

### 3. Open the Frontend
Open `frontend/index.html` directly in your browser.
> No build tools needed!

---

## 📁 Project Structure

```
employee-dbms/
├── backend/
│   └── app.py           # Flask REST API + SQLite DB
├── frontend/
│   ├── index.html       # Main UI
│   ├── css/
│   │   └── style.css    # Styles
│   └── js/
│       └── app.js       # Frontend logic (fetch API)
└── README.md
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | Get all employees (supports `?search=&department=`) |
| GET | `/api/employees/:id` | Get single employee |
| POST | `/api/employees` | Add new employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/departments` | Distinct department list |

---

## 👨‍💻 Author

**Harikrishna S R**  
B.E Computer Science – Sona College of Technology, Salem  
📧 harikrish190604@gmail.com | 📱 +91-9025690948
