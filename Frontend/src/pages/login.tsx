import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { loginSchema, type LoginInput } from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";
import { useAuthStore } from "../store/AuthContext";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      const response = await axios.post(API.AUTH.LOGIN, data, { withCredentials: true });
      useAuthStore.getState().setUser(response.data.user);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold purple-fade-text mb-1">Welcome back</h1>
        <p className="text-text-muted text-sm mb-8">
          Log in to continue your learning journey
        </p>

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
              placeholder="you@example.com"
              {...register("email")}
	      required
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
              placeholder="••••••••"
              {...register("password")}
	      required
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
