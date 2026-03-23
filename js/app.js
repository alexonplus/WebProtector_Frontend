import * as api from './api.js';

// 1. STATE & CONFIGURATION
let token = localStorage.getItem("jwt_token") || "";

// 2. DOM ELEMENT SELECTORS
const authSection = document.getElementById("auth-section");
const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");
const mainSection = document.getElementById("main-section");
const reportsContainer = document.getElementById("reports-container");
const logoutBtn = document.getElementById("logout-btn");

// --- 3. UI NAVIGATION (FORM SWITCHING) ---

document.getElementById("go-to-register").onclick = (e) => {
    e.preventDefault();
    loginCard.classList.add("hidden");
    registerCard.classList.remove("hidden");
};

document.getElementById("go-to-login").onclick = (e) => {
    e.preventDefault();
    registerCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
};

// --- 4. AUTHENTICATION LOGIC ---

document.getElementById("login-btn").onclick = async () => {
    const user = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };

    try {
        const res = await api.loginRequest(user);
        if (res.ok) {
            const data = await res.json();
            token = data.token;
            // FIX: Saving the clean token to storage so other requests can use it
            localStorage.setItem("jwt_token", token); 
            showMainDashboard();
        } else {
            alert("Login failed! Invalid credentials.");
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Server connection error. Is the backend running?");
    }
};

document.getElementById("register-btn").onclick = async () => {
    const newUser = {
        username: document.getElementById("reg-username").value,
        password: document.getElementById("reg-password").value
    };

    if (!newUser.username || !newUser.password) return alert("All fields are required!");

    try {
        const res = await api.registerRequest(newUser);
        if (res.ok) {
            alert("Registration successful! You can now log in.");
            document.getElementById("go-to-login").click();
        } else {
            alert("Registration failed. User might already exist.");
        }
    } catch (err) {
        console.error("Registration Error:", err);
    }
};

// --- 5. SCANNER & REPORTS LOGIC ---

document.getElementById("start-scan-btn").onclick = async () => {
    const urlInput = document.getElementById("scan-url");
    const url = urlInput.value;
    if (!url) return alert("Please enter a URL to scan.");

    try {
        const res = await api.startScanRequest(url, token);
        if (res.ok) {
            urlInput.value = "";
            loadReports();
        } else {
            alert("Scan failed. Status: " + res.status);
        }
    } catch (err) {
        console.error("Scan Error:", err);
    }
};

async function loadReports() {
    try {
        const reports = await api.fetchReports(token);
        reportsContainer.innerHTML = reports.map(r => `
            <div class="report-item card">
                <div>
                    <strong>🌐 ${r.url}</strong><br>
                    <small>Grade: ${r.securityGrade} | Score: ${r.securityScore}</small>
                </div>
                <button class="delete-btn" data-id="${r.id}">🗑️</button>
            </div>
        `).join("");

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => deleteReport(btn.getAttribute("data-id"));
        });

    } catch (err) {
        console.error("Reports Loading Error:", err);
    }
}

async function deleteReport(id) {
    if (!confirm("Are you sure?")) return;
    try {
        const res = await api.deleteReportRequest(id, token);
        if (res.ok) loadReports();
    } catch (err) {
        console.error("Deletion Error:", err);
    }
}

// --- 6. INITIALIZATION & HELPERS ---

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

if (token) showMainDashboard();