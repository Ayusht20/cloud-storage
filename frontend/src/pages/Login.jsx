import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Login = () => {
  const navigate =
    useNavigate();

  const { login } =
    useAuth();


  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setLoading(true);

      try {
        await login({
          email,
          password,
        });

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      } catch (err) {
        setError(
          err.message ||
            "Login failed"
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">
          Welcome back
        </h1>

        <p className="mb-6 text-slate-500">
          Sign in to your cloud storage
        </p>


        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="you@example.com"
            />
          </div>


          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="••••••••"
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>


        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-slate-900"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
};


export default Login;