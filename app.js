// 1. Configuration
const API_URL = "https://localhost:7290/api";
let token = localStorage.getItem("jwt_token") || "";

// 2. Element Selectors
const authSection = document.getElementById("auth-section");
const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");
const mainSection = document.getElementById("main-section");
const reportsContainer = document.getElementById("reports-container");
const logoutBtn = document.getElementById("logout-btn");

// --- 3. UI SWITCHING (The "Register here" fix) ---

// Switch to Register form
document.getElementById("go-to-register").onclick = (e) => {
    e.preventDefault();
    loginCard.classList.add("hidden");
    registerCard.classList.remove("hidden");
};

// Switch back to Login form
document.getElementById("go-to-login").onclick = (e) => {
    e.preventDefault();
    registerCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
};

// --- 4. AUTHENTICATION LOGIC ---

// Login Function
document.getElementById("login-btn").onclick = async () => {
    const user = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };

    try {
        const res = await fetch(`${API_URL}/Auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });

        if (res.ok) {
            token = await res.text();
            localStorage.setItem("jwt_token", token);
            showMainDashboard();
        } else {
            alert("Login failed! Please check your credentials.");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Server error. Is the backend running?");
    }
};

// Register Function
document.getElementById("register-btn").onclick = async () => {
    const newUser = {
        username: document.getElementById("reg-username").value,
        password: document.getElementById("reg-password").value
    };

    if (!newUser.username || !newUser.password) {
        return alert("Please fill in all fields!");
    }

    try {
        const res = await fetch(`${API_URL}/Auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            alert("Registration successful! You can now login.");
            // Automatically switch back to login card
            document.getElementById("go-to-login").click();
        } else {
            alert("Registration failed. User might already exist.");
        }
    } catch (err) {
        console.error("Registration error:", err);
        alert("Failed to connect to the server.");
    }
};

// --- 5. SCANNER LOGIC ---

// Start Scan
document.getElementById("start-scan-btn").onclick = async () => {
    const urlInput = document.getElementById("scan-url");
    const url = urlInput.value;

    if (!url) return alert("Please enter a URL!");

    try {
        const res = await fetch(`${API_URL}/Scanner/scan`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(url)
        });

        if (res.ok) {
            urlInput.value = "";
            loadReports();
        } else {
            alert("Scan failed. Status: " + res.status);
        }
    } catch (err) {
        console.error("Scan error:", err);
    }
};

// Load Reports
async function loadReports() {
    try {
        const res = await fetch(`${API_URL}/Scanner/reports`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const reports = await res.json();
            reportsContainer.innerHTML = reports.map(r => `
                <div class="report-item card">
                    <div>
                        <strong>🌐 ${r.url}</strong><br>
                        <small>Grade: ${r.securityGrade} | Score: ${r.securityScore}</small>
                    </div>
                    <button class="delete-btn" onclick="deleteReport(${r.id})">🗑️</button>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Load reports error:", err);
    }
}

// Delete Report
async function deleteReport(id) {
    if (!confirm("Delete this report?")) return;
    await fetch(`${API_URL}/Scanner/report/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    loadReports();
}

// --- 6. UI HELPERS ---

function showMainDashboard() {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadReports();
}

logoutBtn.onclick = () => {
    localStorage.removeItem("jwt_token");
    location.reload();
};

// Check if user is already logged in
if (token) {
    showMainDashboard();
}