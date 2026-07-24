import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { loginSchema, type LoginInput } from "../lib/validation/auth.schema";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
   try{
 	const response = await axios.post("/auth/login", data);
	console.log(response.data);
   }catch(e){
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
        type="password"
        placeholder="Password"
        {...register("password")}
      />
      <p>{errors.password?.message}</p>

      <button disabled={isSubmitting}>
        Login
      </button>
    </form>
  );
}
