import type { FieldError } from "react-hook-form";

interface FormErrorProps {
  error?: FieldError;
}

export default function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  return (
    <span className="mt-1 block text-sm text-red-500">
      {error.message}
    </span>
  );
}
