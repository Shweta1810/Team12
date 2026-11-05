import { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

interface LoginUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Sales Staff" | "Support Staff";
}

interface LoginProps {
  onLogin: (user: LoginUser) => void;
}

interface LoginResponse {
  message: string;
  token: string;
  user: LoginUser;
}

const API_URL = "http://localhost:5000/api";

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Remove any old/expired authentication tokens
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: LoginResponse | { message: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!("token" in data) || !("user" in data)) {
        throw new Error("Invalid server response.");
      }

      /*
       * Store the NEW token in both places.
       *
       * sessionStorage is used by the application during
       * the current browser session.
       *
       * localStorage is kept temporarily because App.tsx
       * currently reads the token after login.
       */
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      onLogin(data.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Left Section */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-12 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm transition duration-300 hover:scale-110 hover:rotate-3">
              <ShieldCheck
                size={30}
                className="transition duration-300 group-hover:scale-110"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                CRM
              </h1>

              <p className="text-sm text-blue-100">
                Customer Relationship Management
              </p>
            </div>
          </div>

          {/* Main Text */}
          <div className="mt-28 max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-100">
              Reach • Acquire • Convert • Retain • Loyalty
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Build stronger customer relationships.
            </h2>

            <p className="mt-6 text-lg leading-8 text-blue-50">
              Manage leads, customers, interactions, sales,
              support and loyalty from one simple CRM platform.
            </p>
          </div>
        </div>

        {/* Security Card */}
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition duration-300 hover:bg-white/15 hover:shadow-xl">
          <div className="flex items-center gap-4">
            <div className="group flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Lock
                size={23}
                className="transition duration-300 group-hover:scale-110"
              />
            </div>

            <div>
              <p className="font-semibold">
                Secure Access
              </p>

              <p className="mt-1 text-sm text-blue-100">
                Your account is protected using secure authentication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex min-h-screen flex-1 items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h1 className="font-bold text-slate-800">
                CRM
              </h1>

              <p className="text-xs text-slate-500">
                Customer Relationship Management
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-slate-500">
              Sign in to continue to your CRM dashboard.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>

              <div className="group relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="group relative">
                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:scale-110 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                Remember me
              </label>

              <button
                type="button"
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-100 transition duration-300 hover:scale-[1.01] hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in

                  <ArrowRight
                    size={19}
                    className="transition duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-slate-400">
            CRM • Secure Customer Relationship Management
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;