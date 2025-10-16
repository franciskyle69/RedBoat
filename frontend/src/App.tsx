import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyCodePage from "./pages/VerifyCodePage";
import ResetPassword from "./pages/ResetPassword";
import ChooseUsername from "./pages/ChooseUsername";
import Dashboard from "./pages/User/Dashboard";
import AdminDashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import RoomManagement from "./pages/Admin/RoomManagement";
import Bookings from "./pages/Admin/Bookings";
import AdminCalendar from "./pages/Admin/Calendar";
import Housekeeping from "./pages/Admin/Housekeeping";
import Reports from "./pages/Admin/Reports";
import AdminSettings from "./pages/Admin/Settings";
import UserDashboard from "./pages/User/Dashboard";
import Profile from "./pages/User/Profile";
import UserBookings from "./pages/User/Bookings";
import Rooms from "./pages/User/Rooms";
import Calendar from "./pages/User/Calendar";
import Feedback from "./pages/User/Feedback";
import UserSettings from "./pages/User/Settings";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/choose-username" element={<ChooseUsername />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user/profile" element={<Profile />} />
          <Route path="/user/bookings" element={<UserBookings />} />
          <Route path="/user/rooms" element={<Rooms />} />
          <Route path="/user/calendar" element={<Calendar />} />
          <Route path="/user/feedback" element={<Feedback />} />
          <Route path="/user/settings" element={<UserSettings />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/user-management" element={<UserManagement />} />
          <Route path="/admin/room-management" element={<RoomManagement />} />
          <Route path="/admin/bookings" element={<Bookings />} />
          <Route path="/admin/calendar" element={<AdminCalendar />} />
          <Route path="/admin/housekeeping" element={<Housekeeping />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
