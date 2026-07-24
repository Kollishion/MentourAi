import axios from "axios";

import { API } from "../lib/api";
import { useAuthStore } from "../store/AuthContext";

export default function LogoutButton() {

    async function logout(){

        try{

            await axios.post(
                API.AUTH.LOGOUT,
                {},
                {
                    withCredentials:true,
                }
            );
	    useAuthStore.getState().logout();
        }catch(e){
            console.error(e);
        }

    }

    return (
        <button onClick={logout}>
            Logout
        </button>
    );
}
