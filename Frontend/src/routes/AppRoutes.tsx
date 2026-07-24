import { Route, Routes } from "react-router-dom"
import Home from "../pages/Home"
import Login from "../pages/login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import VerifyEmail from "../pages/VerifyEmail"
import ForgotPassword from "../pages/ForgotPassword"
import ResetPassword from "../pages/ResetPassword"
import Profile from "../pages/Profile"
import AdminDashboard from "../pages/AdminDashboard"

const AppRoutes = () => {
  return (
    <div>
	<Routes>
	  <Route path="/" element={<Home />} />
	  <Route path="/login" element={<Login />} />
	  <Route path="/register" element={<Register />} />
	  <Route path="/dashboard" element={<Dashboard />} />
	  <Route path="/verify-email" element={<VerifyEmail />} />
	  <Route path="/forgot-password" element={<ForgotPassword />} />
	  <Route path="/reset-password" element={<ResetPassword />} />
	  <Route path="/get-profile" element={<Profile />} />
	  <Route path="/admin-dashboard" element={<AdminDashboard />} />
	</Routes>
    </div>
  )
}

export default AppRoutes
