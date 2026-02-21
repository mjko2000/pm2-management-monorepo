import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, loginStage } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1117 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#6366f1" }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Users with unresolved first-login flags are restricted to /profile
  const requiresFirstLogin = user?.mustChangePassword || user?.mustChangeEmail || loginStage === "FIRST_LOGIN_REQUIRED";
  if (requiresFirstLogin && location.pathname !== "/profile") {
    return <Navigate to="/profile?firstLogin=1" replace />;
  }

  return <>{children}</>;
}
