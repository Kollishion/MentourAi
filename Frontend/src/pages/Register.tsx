import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  registerSchema,
  type RegisterInput,
} from "../lib/validation/auth.schema";

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    try{
    const response = await axios.post("/auth/register", data);
    console.log(response.data);
  }catch(e){
 	console.error(e);
  }
}

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        placeholder="Username"
        {...register("username")}
      />
      <p>{errors.username?.message}</p>

      <input
        placeholder="Email"
        {...register("email")}
      />
      <p>{errors.email?.message}</p>

      <input
        type="password"
        placeholder="Password"
        {...register("password")}
      />
      <p>{errors.password?.message}</p>

      <button disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}
