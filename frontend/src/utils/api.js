import axios from "axios";

// Create an instance of Axios with the base URL for API requests
const API = axios.create({
  baseURL: "http://localhost:5000",
});

// Helper function to get the token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Utility function to handle API errors more gracefully
const handleApiError = (error) => {
  // You could add logic to handle specific HTTP errors, e.g., 401 for unauthorized, etc.
  if (error.response) {
    // The server responded with a status code that falls out of the range of 2xx
    console.error("API Error: ", error.response.data);
    throw new Error(error.response.data.message || "An error occurred while processing your request.");
  } else if (error.request) {
    // The request was made but no response was received
    console.error("No response received: ", error.request);
    throw new Error("Network error. Please try again later.");
  } else {
    // Something else happened during request setup
    console.error("Request Setup Error: ", error.message);
    throw new Error("An error occurred. Please try again later.");
  }
};

// Upload resume and parse it
export const uploadResume = async (file) => {
  try {
    const token = localStorage.getItem("token");
    console.log("Token:", token);

    const formData = new FormData();
    formData.append("resume", file);

    const res = await API.post("/parse-resume", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error) {
    console.error("Upload failed:", error?.response?.data || error.message);
    handleApiError(error);
  }
};

export const saveResume = async (resumeText, token) => {
  const res = await axios.post(
    "http://127.0.0.1:5000/save-resume",
    { resume: resumeText },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getResume = async (token) => {
  const res = await axios.get("http://127.0.0.1:5000/get-resume", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.resume;
};

// Generate questions based on the parsed resume and user role
export const generateQuestions = async (parsedResume, role) => {
  try {
    const res = await API.post(
      "/generate-questions",
      { parsed: parsedResume, role },
      { headers: getAuthHeader() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Generate follow-up questions based on the given answer and role
export const followUpQuestions = async (answer, role) => {
  try {
    const res = await API.post(
      "/follow-up",
      { answer, role },
      { headers: getAuthHeader() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Generate feedback for a coding test
export const generateFeedback = async (role, test_type, questions, answers) => {
  try {
    const res = await API.post(
      "/generate-feedback",
      { role, test_type, questions, answers },
      { headers: getAuthHeader() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Generate aptitude questions based on the level and topic
export const generateAptitude = async (level, topic = "Random") => {
  try {
    const res = await API.post(
      "/generate-aptitude",
      { level, topic },
      { headers: getAuthHeader() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Generate coding problems based on the level and topic
export const generateCoding = async (level, topic = "Random") => {
  try {
    const res = await API.post(
      "/generate-coding",
      { level, topic },
      { headers: getAuthHeader() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Run a code check for a given coding problem
export const runCode = async (language, code, problem) => {
  try {
    return generateFeedback(
      "user",
      "coding-check",
      [problem],
      [{ language, code }]
    );
  } catch (error) {
    handleApiError(error);
  }
};

// Submit code to be executed and evaluated with test cases
export const submitCode = async (language, code, test_cases = []) => {
  try {
    const res = await API.post(
      "/submit-code",
      { language, code, test_cases },
      { headers: getAuthHeader() }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Fetch user progress
export const fetchUserProgress = async (username) => {
  try {
    const res = await API.get(`/api/progress/${username}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ** NEW: Fetch detailed questions for a specific test by ID **
export const getTestQuestions = async (testId) => {
  try {
    const res = await API.get(`/api/test-questions/${testId}`, {
      headers: getAuthHeader(),
    });
    return res.data.questions; // assuming backend sends { questions: [...] }
  } catch (error) {
    handleApiError(error);
  }
};