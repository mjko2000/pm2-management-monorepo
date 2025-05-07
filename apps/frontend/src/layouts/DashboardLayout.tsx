import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

const DRAWER_WIDTH = 240;

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />
      <TopBar
        drawerOpen={drawerOpen}
        drawerWidth={DRAWER_WIDTH}
        toggleDrawer={toggleDrawer}
      />
      <Sidebar
        drawerOpen={drawerOpen}
        drawerWidth={DRAWER_WIDTH}
        toggleDrawer={toggleDrawer}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
