import { useEffect, useState } from "react";
import axios from "axios";

import { API } from "../lib/api";

export default function Profile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await axios.get(
          API.AUTH.PROFILE,
          {
            withCredentials: true,
          }
        );

        setUser(response.data);
      } catch (e) {
        console.error(e);
      }
    }

    fetchProfile();
  }, []);

  if (!user) return <h1>Loading...</h1>;

  return (
    <>
      <h1>{user.username}</h1>
      <p>{user.email}</p>
    </>
  );
}
