import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Layout from "./components/Layout";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import NewService from "./pages/NewService";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import { Logs } from "./pages/Logs";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Routes>
            <Route index path="/" element={<Navigate to="/dashboard" />} />
            <Route index path="/dashboard" element={<Dashboard />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/new" element={<NewService />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
