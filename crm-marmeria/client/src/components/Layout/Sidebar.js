import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Inventory as MaterialsIcon,
  Email as EmailIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Clienti',
    icon: <PeopleIcon />,
    path: '/clients',
  },
  {
    text: 'Ordini',
    icon: <OrdersIcon />,
    path: '/orders',
  },
  {
    text: 'Materiali',
    icon: <MaterialsIcon />,
    path: '/materials',
  },
  {
    text: 'Gmail',
    icon: <EmailIcon />,
    path: '/gmail',
  },
  {
    text: 'Analytics',
    icon: <AnalyticsIcon />,
    path: '/analytics',
  },
  {
    text: 'Impostazioni',
    icon: <SettingsIcon />,
    path: '/settings',
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          CRM Marmeria
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems
          .filter((item) => {
            // Nascondi Gmail agli operai
            if (item.path === '/gmail' && user?.role === 'worker') {
              return false;
            }
            return true;
          })
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;