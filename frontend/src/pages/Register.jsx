import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Register = () => {
  const navigate =
    useNavigate();

  const { register } =
    useAuth();


  const [fullName, setFullName] =
    useState("");

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
        await register({
          full_name: fullName,
          email,
          password,
        });

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      } catch (err) {
        setError(
          err.message ||
            "Registration failed"
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">
          Create account
        </h1>

        <p className="mb-6 text-slate-500">
          Start using your cloud storage
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
              Full name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="Your name"
            />
          </div>


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
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              placeholder="At least 8 characters"
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>


        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-slate-900"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};


export default Register;