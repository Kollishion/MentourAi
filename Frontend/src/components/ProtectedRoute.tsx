import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/AuthContext.tsx";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {

    const user = useAuthStore((s) => s.user);

    const loading = useAuthStore((s) => s.loading);

    if (loading)
        return <h1>Loading...</h1>;

    if (!user)
        return <Navigate to="/login" replace />;

    return children;

}
