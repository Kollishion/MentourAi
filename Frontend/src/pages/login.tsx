import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { loginSchema, type LoginInput } from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";

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
 	const response = await axios.post(API.AUTH.LOGIN, data, {withCredentials: true});
	console.log(response.data);
   }catch(e){
 	console.error(e);
   }
    
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        id="email"
        placeholder="Email"
        {...register("email")}
      />
      <FormError error={errors.email}/>

      <input
        type="password"
        placeholder="Password"
        {...register("password")}
      />
      <FormError error={errors.password}/>

      <button disabled={isSubmitting}>
        Login
      </button>
    </form>
  );
}
