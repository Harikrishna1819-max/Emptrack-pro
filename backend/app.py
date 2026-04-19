from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "employees.db")

# --- Database Setup ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                department TEXT NOT NULL,
                role TEXT NOT NULL,
                salary REAL NOT NULL,
                join_date TEXT NOT NULL
            )
        """)
        # Seed demo data if empty
        if conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0] == 0:
            demo = [
                ("Ravi Kumar", "ravi@company.com", "9876543210", "Engineering", "Software Engineer", 65000, "2023-01-15"),
                ("Priya Sharma", "priya@company.com", "9876543211", "Marketing", "Marketing Lead", 70000, "2022-06-01"),
                ("Arjun Nair", "arjun@company.com", "9876543212", "HR", "HR Manager", 60000, "2021-09-10"),
                ("Deepa Iyer", "deepa@company.com", "9876543213", "Engineering", "Frontend Dev", 62000, "2023-03-20"),
            ]
            conn.executemany(
                "INSERT INTO employees (name,email,phone,department,role,salary,join_date) VALUES (?,?,?,?,?,?,?)",
                demo
            )
        conn.commit()

init_db()

# --- API Routes ---

@app.route("/api/employees", methods=["GET"])
def get_employees():
    search = request.args.get("search", "").strip()
    dept = request.args.get("department", "").strip()
    with get_db() as conn:
        query = "SELECT * FROM employees WHERE 1=1"
        params = []
        if search:
            query += " AND (name LIKE ? OR email LIKE ? OR role LIKE ?)"
            params += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if dept:
            query += " AND department = ?"
            params.append(dept)
        query += " ORDER BY id DESC"
        rows = conn.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/employees/<int:emp_id>", methods=["GET"])
def get_employee(emp_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(dict(row))

@app.route("/api/employees", methods=["POST"])
def add_employee():
    data = request.json
    required = ["name", "email", "department", "role", "salary", "join_date"]
    if not all(data.get(f) for f in required):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        with get_db() as conn:
            cursor = conn.execute(
                "INSERT INTO employees (name,email,phone,department,role,salary,join_date) VALUES (?,?,?,?,?,?,?)",
                (data["name"], data["email"], data.get("phone",""), data["department"], data["role"], data["salary"], data["join_date"])
            )
            conn.commit()
            new_id = cursor.lastrowid
        return jsonify({"message": "Employee added", "id": new_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409

@app.route("/api/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):
    data = request.json
    with get_db() as conn:
        row = conn.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404
        conn.execute(
            "UPDATE employees SET name=?,email=?,phone=?,department=?,role=?,salary=?,join_date=? WHERE id=?",
            (data["name"], data["email"], data.get("phone",""), data["department"], data["role"], data["salary"], data["join_date"], emp_id)
        )
        conn.commit()
    return jsonify({"message": "Employee updated"})

@app.route("/api/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
        if not row:
            return jsonify({"error": "Not found"}), 404
        conn.execute("DELETE FROM employees WHERE id=?", (emp_id,))
        conn.commit()
    return jsonify({"message": "Employee deleted"})

@app.route("/api/departments", methods=["GET"])
def get_departments():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT department FROM employees ORDER BY department").fetchall()
    return jsonify([r["department"] for r in rows])

@app.route("/api/stats", methods=["GET"])
def get_stats():
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) as c FROM employees").fetchone()["c"]
        avg_salary = conn.execute("SELECT ROUND(AVG(salary),2) as a FROM employees").fetchone()["a"] or 0
        depts = conn.execute("SELECT COUNT(DISTINCT department) as d FROM employees").fetchone()["d"]
    return jsonify({"total": total, "avg_salary": avg_salary, "departments": depts})

if __name__ == "__main__":
    print("✅ Employee DBMS Backend running at http://localhost:5000")
    app.run(debug=True, port=5000)
