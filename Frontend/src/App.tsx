import "./App.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import { useAuthStore } from "./store/AuthContext";
import { API } from "./lib/api.ts";
import axios from "axios";
const App = () => {
const setUser = useAuthStore((state) => state.setUser);

    const setLoading = useAuthStore((state) => state.setLoading);

    useEffect(() => {

        async function fetchProfile() {

            try {

                const response = await axios.get(
                    API.AUTH.PROFILE,
                    {
                        withCredentials: true,
                    }
                );

                setUser(response.data.user);

            }

            catch {

                setUser(null);

            }

            finally {

                setLoading(false);

            }

        }

        fetchProfile();

    }, []);
	
  return (
    <>
	<AppRoutes />
    </>
  )
}

export default App
