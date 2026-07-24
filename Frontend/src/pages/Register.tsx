import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { registerSchema, type RegisterInput } from "../lib/validation/auth.schema";
import { API } from "../lib/api";
import FormError from "../components/forms/FormError";

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
    const response = await axios.post(API.AUTH.REGISTER, data);
    console.log(response.data);
  }catch(e){
 	console.error(e);
  }
}

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        id="username"
        placeholder="Username"
        {...register("username")}
      />
      <FormError error={errors.username}/>

      <input
        id="email"
        placeholder="Email"
        {...register("email")}
      />
      <FormError error={errors.email}/>

      <input
        id="password"
        type="password"
        placeholder="Password"
        {...register("password")}
      />
      <FormError error={errors.password}/>

      <button disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}
