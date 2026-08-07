import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailParam,
      otp: "",
    },
  });

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function onSubmit(data: VerifyEmailInput) {
    try {
      setServerError(null);
      setSuccessMessage(null);
      const response = await axios.post(API.AUTH.VERIFY_EMAIL, data);
      if (response.data.success) {
        navigate("/login?verified=true");
      }
    } catch (e: any) {
      console.error(e);
      const message =
        e.response?.data?.message ||
        "Email verification failed. Please check your OTP and try again.";
      setServerError(message);
    }
  }

  const handleResendOtp = useCallback(async () => {
    const email = getValues("email");
    if (!email) {
      setServerError("Please enter your email address first.");
      return;
    }

    try {
      setIsResending(true);
      setServerError(null);
      setSuccessMessage(null);
      await axios.post(API.AUTH.RESEND_VERIFICATION, { email });
      setSuccessMessage("A new verification code has been sent to your email.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      console.error(e);
      const message =
        e.response?.data?.message ||
        "Failed to resend verification code. Please try again.";
      setServerError(message);
    } finally {
      setIsResending(false);
    }
  }, [getValues]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold purple-fade-text mb-1">Verify your email</h1>
        <p className="text-text-muted text-sm mb-6">
          Enter the code we sent to your inbox
        </p>

        {serverError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {successMessage}
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
              type="email"
              autoComplete="email"
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

        <div className="mt-5 text-center">
          <p className="text-text-muted text-sm mb-2">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || resendCooldown > 0}
            className="text-primary hover:text-secondary transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending
              ? "Sending..."
              : resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
