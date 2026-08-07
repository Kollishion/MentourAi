import "./App.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import { useAuthStore } from "./store/AuthContext";
import axios from "axios";
import { API } from "./lib/api";

const App = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const setLoading = useAuthStore((state) => state.setLoading);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(API.AUTH.PROFILE, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                });

                setUser(response.data.data?.user || response.data.data || response.data.user);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    console.error("Session expired. Please log in again.");
                    useAuthStore.getState().logout();
                } else {
                    console.error("Profile fetch error:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, setUser, setLoading]);

    return (
        <>
            <AppRoutes />
        </>
    );
};

export default App;