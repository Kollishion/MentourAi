import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    try {
      const response = await axios.post(API.AUTH.FORGOT_PASSWORD, data);
      console.log(response.data);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold purple-fade-text mb-1">Reset password</h1>
        <p className="text-text-muted text-sm mb-8">
          Enter your email and we'll send you a reset link
        </p>

        {isSubmitSuccessful ? (
          <p className="text-sm text-success">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
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
                className="w-full bg-surface-2 border placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <FormError error={errors.email} />
            </div>

            <button
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-muted mt-6">
          Remembered your password?{" "}
          <a href="/login" className="text-primary hover:text-secondary transition-colors">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
