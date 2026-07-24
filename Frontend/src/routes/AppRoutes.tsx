import { Route, Routes } from "react-router-dom"
import Home from "../pages/Home"
import Login from "../pages/login"
import Register from "../pages/Register"

const AppRoutes = () => {
  return (
    <div>
	<Routes>
	  <Route path="/" element={<Home />} />
	  <Route path="/login" element={<Login />} />
	  <Route path="/register" element={<Register />} />
	</Routes>
    </div>
  )
}

export default AppRoutes
