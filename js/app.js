import * as api from './api.js';

// State
let token = localStorage.getItem("jwt_token") || "";

// DOM
const authSection = document.getElementById("auth-section");
const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");
const mainSection = document.getElementById("main-section");
const reportsContainer = document.getElementById("reports-container");
const reportsEmpty = document.getElementById("reports-empty");
const reportsCount = document.getElementById("reports-count");
const logoutBtn = document.getElementById("logout-btn");

// === TOAST NOTIFICATIONS ===
function showToast(message, type = "info") {
    const icons = {
        success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        info:    `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icons[type]}<span>${message}</span>`;

    const container = document.getElementById("toast-container");
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastOut 0.28s ease forwards";
        setTimeout(() => toast.remove(), 280);
    }, 3500);
}

// === LOADING STATE ===
function setLoading(btn, loading) {
    const span = btn.querySelector("span");
    const loader = btn.querySelector(".btn-loader");
    const arrow = btn.querySelector(".btn-arrow");

    btn.disabled = loading;
    if (span) span.style.opacity = loading ? "0.5" : "1";
    if (loader) loader.classList.toggle("hidden", !loading);
    if (arrow) arrow.style.opacity = loading ? "0" : "1";
}

// === GRADE COLOR ===
function getGradeClass(grade) {
    if (!grade) return "grade-b";
    const g = grade.toUpperCase().replace("+", "").replace("-", "");
    if (g === "A") return "grade-a";
    if (g === "B") return "grade-b";
    if (g === "C") return "grade-c";
    if (g === "D") return "grade-d";
    return "grade-f";
}

// === FORM SWITCHING ===
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

// === LOGIN ===
document.getElementById("login-btn").onclick = async () => {
    const btn = document.getElementById("login-btn");
    const user = {
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
    };

    if (!user.username || !user.password) {
        showToast("Please fill in all fields.", "error");
        return;
    }

    setLoading(btn, true);
    try {
        const res = await api.loginRequest(user);
        if (res.ok) {
            const data = await res.json();
            token = data.token;
            localStorage.setItem("jwt_token", token);
            showMainDashboard();
        } else {
            showToast("Invalid credentials. Please try again.", "error");
        }
    } catch {
        showToast("Cannot connect to server. Is the backend running?", "error");
    } finally {
        setLoading(btn, false);
    }
};

// === REGISTER ===
document.getElementById("register-btn").onclick = async () => {
    const btn = document.getElementById("register-btn");
    const newUser = {
        username: document.getElementById("reg-username").value.trim(),
        password: document.getElementById("reg-password").value
    };

    if (!newUser.username || !newUser.password) {
        showToast("All fields are required.", "error");
        return;
    }

    setLoading(btn, true);
    try {
        const res = await api.registerRequest(newUser);
        if (res.ok) {
            showToast("Account created! Please sign in.", "success");
            document.getElementById("go-to-login").click();
        } else {
            showToast("Registration failed. Username may already exist.", "error");
        }
    } catch {
        showToast("Cannot connect to server.", "error");
    } finally {
        setLoading(btn, false);
    }
};

// === SCAN ===
document.getElementById("start-scan-btn").onclick = async () => {
    const btn = document.getElementById("start-scan-btn");
    const urlInput = document.getElementById("scan-url");
    const url = urlInput.value.trim();

    if (!url) {
        showToast("Please enter a URL to scan.", "error");
        return;
    }

    setLoading(btn, true);
    try {
        const res = await api.startScanRequest(url, token);
        if (res.ok) {
            urlInput.value = "";
            showToast("Scan complete! Report is ready.", "success");
            loadReports();
        } else {
            showToast("Scan failed. Status: " + res.status, "error");
        }
    } catch {
        showToast("Scan error. Please try again.", "error");
    } finally {
        setLoading(btn, false);
    }
};

// === LOAD REPORTS ===
async function loadReports() {
    try {
        const reports = await api.fetchReports(token);

        reportsCount.textContent = `${reports.length} scan${reports.length !== 1 ? "s" : ""}`;

        if (reports.length === 0) {
            reportsContainer.innerHTML = "";
            reportsEmpty.classList.remove("hidden");
            return;
        }

        reportsEmpty.classList.add("hidden");
        reportsContainer.innerHTML = reports.map((r, i) => `
            <div class="report-item card" style="animation-delay:${i * 40}ms">
                <div class="report-info">
                    <div class="report-url">${r.url}</div>
                    <div class="report-meta">
                        <span class="grade-badge ${getGradeClass(r.securityGrade)}">${r.securityGrade || "N/A"}</span>
                        <span class="report-score">Score: ${r.securityScore ?? "—"}</span>
                    </div>
                </div>
                <div class="report-actions">
                    <button class="delete-btn" data-id="${r.id}" title="Delete report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join("");

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => deleteReport(btn.getAttribute("data-id"));
        });

    } catch {
        showToast("Failed to load reports.", "error");
    }
}

// === DELETE REPORT ===
async function deleteReport(id) {
    if (!confirm("Delete this report?")) return;
    try {
        const res = await api.deleteReportRequest(id, token);
        if (res.ok) {
            showToast("Report deleted.", "info");
            loadReports();
        }
    } catch {
        showToast("Failed to delete report.", "error");
    }
}

// === SHOW DASHBOARD ===
function showMainDashboard() {
    authSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadReports();
}

// === LOGOUT ===
logoutBtn.onclick = () => {
    localStorage.removeItem("jwt_token");
    location.reload();
};

// Auto-login
if (token) showMainDashboard();
