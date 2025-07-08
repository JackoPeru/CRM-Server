import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
} from '@mui/material';
import {
  Email as EmailIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Gestione Gmail',
      description: 'Connetti e gestisci le tue email Gmail',
      icon: <EmailIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/gmail'),
      color: '#4285f4',
    },
    {
      title: 'Clienti',
      description: 'Gestisci i tuoi clienti',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/clients'),
      color: '#34a853',
    },
    {
      title: 'Ordini',
      description: 'Visualizza e gestisci gli ordini',
      icon: <OrdersIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/orders'),
      color: '#fbbc04',
    },
    {
      title: 'Analytics',
      description: 'Visualizza le statistiche',
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/analytics'),
      color: '#ea4335',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard CRM Marmeria
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Benvenuto nel sistema di gestione CRM. Seleziona un'azione rapida per iniziare.
      </Typography>

      <Grid container spacing={3}>
        {quickActions
          .filter((action) => {
            // Nascondi Gmail agli operai
            if (action.title === 'Gestione Gmail' && user?.role === 'worker') {
              return false;
            }
            return true;
          })
          .map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={action.action}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    color: action.color,
                    mb: 2,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: action.color,
                    '&:hover': {
                      backgroundColor: action.color,
                      opacity: 0.8,
                    },
                  }}
                >
                  Apri
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Nascondi sezione Gmail agli operai */}
      {user?.role !== 'worker' && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integrazione Gmail
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Il sistema CRM è ora integrato con Gmail per una gestione completa delle comunicazioni.
                Puoi:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2">
                  Leggere e gestire le email direttamente dal CRM
                </Typography>
                <Typography component="li" variant="body2">
                  Inviare email ai clienti
                </Typography>
                <Typography component="li" variant="body2">
                  Organizzare le email con etichette
                </Typography>
                <Typography component="li" variant="body2">
                  Cercare messaggi specifici
                </Typography>
                <Typography component="li" variant="body2">
                  Tracciare le conversazioni con i clienti
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;