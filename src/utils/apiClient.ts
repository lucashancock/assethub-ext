// utils/apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5007/api",
  timeout: 5000, // optional timeout
});

export default apiClient;
