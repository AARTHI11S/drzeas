const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 45000;

export async function analyzeMaizeImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail ?? "Backend prediction failed.");
    }

    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Backend prediction timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export { API_BASE_URL };
