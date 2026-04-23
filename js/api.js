// Centralized API configuration
export const API_URL = "http://localhost:5246/api";

/**
 * Helper to generate request headers.
 */
const getHeaders = (token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
};

// 1. Auth requests
export async function loginRequest(user) {
    return await fetch(`${API_URL}/Auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(user)
    });
}

export async function registerRequest(newUser) {
    return await fetch(`${API_URL}/Auth/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newUser)
    });
}

// 2. Scanner requests
export async function fetchReports(token) {
    const res = await fetch(`${API_URL}/Scanner/reports`, {
        headers: getHeaders(token)
    });
    if (!res.ok) throw new Error("Could not fetch reports.");
    return await res.json();
}

export async function startScanRequest(url, token) {
    return await fetch(`${API_URL}/Scanner/scan`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(url)
    });
}

export async function deleteReportRequest(id, token) {
    return await fetch(`${API_URL}/Scanner/report/${id}`, {
        method: "DELETE",
        headers: getHeaders(token)
    });
}