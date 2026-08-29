import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/Landingpage";
import LoginPage from "./pages/Loginpage";
import PatientDashboard from "./pages/Patientdashboard";
import DoctorDashboard from "./pages/Doctordashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FamilyDashboard from "./pages/FamilyDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import LoadingScreen from "./components/LoadingScreen";
import "./styles/global.css";
import { useState } from "react";

const ROLE_DASHBOARDS = {
  patient: (props) => <PatientDashboard {...props} />,
  doctor:  (props) => <DoctorDashboard  {...props} />,
  admin:   (props) => <AdminDashboard   {...props} />,
  family:  (props) => <FamilyDashboard  {...props} />,
};

export default function App() {
  const { user, profile, loading } = useAuth();
  const [page, setPage]     = useState("landing");
  const [demoRole, setDemoRole] = useState(null);

  if (loading) return <LoadingScreen />;

  // demo mode
  if (demoRole && ROLE_DASHBOARDS[demoRole]) {
    return ROLE_DASHBOARDS[demoRole]({ onLogout: () => setDemoRole(null), demo: true });
  }

  // real auth
  if (user && profile && profile.role) {
    const Dashboard = ROLE_DASHBOARDS[profile.role];
    if (Dashboard) return Dashboard({ onLogout: () => {} });
  }

  if (page === "landing") return <LandingPage navigate={setPage} />;
  if (page === "login")   return <LoginPage navigate={setPage} onDemo={setDemoRole} />;
  return <NotFoundPage navigate={setPage} />;
}