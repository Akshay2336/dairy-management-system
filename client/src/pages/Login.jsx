import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prevent multiple requests
    if (loading) return;

    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });

      // Save token and user details
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Clear form
      setEmail("");
      setPassword("");

      // Show success toast only once
      toast.success("Login Successful", {
        toastId: "login-success",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error(error.response?.data);

      toast.error(
        error.response?.data?.message || "Login Failed",
        {
          toastId: "login-error",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md p-6 md:p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-green-700 mb-6">
          Dairy Management
        </h1>

        <h2 className="text-xl font-semibold text-center mb-6">
          Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded-lg text-white font-semibold transition duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-right mt-3">
          <Link
            to="/forgot-password"
            className="text-green-600 hover:underline text-sm"
          >
            Forgot Password?
          </Link>
        </div>

        <p className="text-center mt-5 text-gray-600">
          Don't have an account?
          <Link
            to="/register"
            className="text-green-600 ml-1 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;