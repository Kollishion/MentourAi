import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";

export default function VerifyEmail() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
  });

  async function onSubmit(data: VerifyEmailInput) {
    try {
      const response = await axios.post(API.AUTH.VERIFY_EMAIL, data);
      console.log(response.data);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold purple-fade-text mb-1">Verify your email</h1>
        <p className="text-text-muted text-sm mb-8">
          Enter the code we sent to your inbox
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
              className="w-full bg-surface-2 border placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <FormError error={errors.email} />
          </div>

          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-text-muted mb-1.5"
            >
              OTP
            </label>
            <input
              id="otp"
              placeholder="6-digit code"
              {...register("otp")}
              className="w-full bg-surface-2 border placeholder:text-text-subtle rounded-lg px-4 py-2.5 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary tracking-widest text-center"
            />
            <FormError error={errors.otp} />
          </div>

          <button
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-secondary transition-colors text-white font-semibold rounded-lg py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
