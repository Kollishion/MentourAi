import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { loginSchema, type LoginInput } from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";
import { useAuthStore } from "../store/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const [searchParams] = useSearchParams();
  const isVerified = searchParams.get("verified") === "true";
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();

  const onSubmit = async (data: LoginInput) => {
    try {
      setServerError(null);
      const response = await axios.post(API.AUTH.LOGIN, data, { withCredentials: true });
      console.log('success:', response.data);
      const { user, accessToken } = response.data.data;
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setToken(accessToken);
      navigate("/dashboard");
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response) {
        console.error(e);
        const message =
          e.response?.data?.message ||
          "Login failed. Please check your email and password.";
        setServerError(message);

        // If email isn't verified, resend OTP and redirect to verification page
        if (message.toLowerCase().includes("verify your email")) {
          try {
            await axios.post(API.AUTH.RESEND_VERIFICATION, { email: data.email });
          } catch {
            // Ignore resend errors — user can manually resend on the verify page
          }
          setTimeout(() => {
            navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
          }, 2000);
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold purple-fade-text mb-1">Welcome back</h1>
        <p className="text-text-muted text-sm mb-6">
          Log in to continue your learning journey
        </p>

        {isVerified && !serverError && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            Email verified successfully! Please log in to continue.
          </div>
        )}

        {serverError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-muted mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"                 // NEW: proper mobile keyboard + validation
              autoComplete="email"          // NEW: fixes browser warning
              placeholder="you@example.com"
              {...register("email")}
              className="w-full bg-surface-2 border placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <FormError error={errors.email} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-muted"
              >
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-xs text-primary hover:text-secondary transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"  // NEW: fixes browser warning
              placeholder="••••••••"
              {...register("password")}
              className="w-full bg-surface-2 border placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <FormError error={errors.password} />
          </div>

          <button
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-primary hover:text-secondary transition-colors">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}