import axios from "axios";

import { API } from "../lib/api";

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

            console.log("Logged out");

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
