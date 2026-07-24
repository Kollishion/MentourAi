import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from "../lib/validation/auth.schema";

import { API } from "../lib/api";

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
      const response = await axios.post(
        API.AUTH.VERIFY_EMAIL,
        data
      );

      console.log(response.data);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        placeholder="Email"
        {...register("email")}
      />
      <p>{errors.email?.message}</p>

      <input
        placeholder="OTP"
        {...register("otp")}
      />
      <p>{errors.otp?.message}</p>

      <button disabled={isSubmitting}>
        Verify Email
      </button>
    </form>
  );
}
