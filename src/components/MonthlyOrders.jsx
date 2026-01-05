import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import { ArrowBack, CheckCircle, Pending, Autorenew } from '@mui/icons-material';

const MonthlyOrders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Retrieve data passed from Analytics component
  const { orders = [], month, year } = location.state || {};

  // Handle case where state is missing (e.g., direct URL access)
  if (!location.state) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, width: '100vw' }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No order data found.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Please access this page from the Dashboard analytics.
        </Typography>
        <IconButton onClick={() => navigate('/')} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}>
          <ArrowBack />
        </IconButton>
      </Box>
    );
  }

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const sections = [
    {
      title: 'Completed',
      status: 'completed',
      color: theme.palette.success.main,
      icon: <CheckCircle sx={{ color: theme.palette.success.main }} />,
      items: orders.filter(o => o.status === 'completed')
    },
    {
      title: 'In Progress',
      status: 'in-progress',
      color: theme.palette.info.main,
      icon: <Autorenew sx={{ color: theme.palette.info.main }} />,
      items: orders.filter(o => o.status === 'in-progress')
    },
    {
      title: 'Pending',
      status: 'pending',
      color: theme.palette.warning.main,
      icon: <Pending sx={{ color: theme.palette.warning.main }} />,
      items: orders.filter(o => o.status === 'pending')
    }
  ];

  return (
    <Box sx={{
      p: { xs: 2, md: 4 },
      minHeight: '100vh',
      minWidth: '90vw',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2, bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          {monthName} {year} - Monthly Overview
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} md={4} key={section.title}>
            <Card sx={{
              height: '100%',
              borderRadius: 3,
              width: {
                xs: '92vw',   // mobile
                sm: '99vw',   // tablet
                md: '85vw',
              },

              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {section.icon}
                    <Typography variant="h6" fontWeight="bold">
                      {section.title}
                    </Typography>
                  </Box>
                  <Chip
                    label={section.items.length}
                    size="small"
                    sx={{
                      bgcolor: section.color,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <List sx={{
                  maxHeight: '65vh',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '3px' }
                }}>
                  {section.items.length > 0 ? (
                    section.items.map((order) => (
                      <ListItem
                        key={order.id}
                        sx={{
                          mb: 1.5,
                          bgcolor: 'white',
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-2px)' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            src={order.sampleImageUrl || order.image}
                            alt={order.name}
                            sx={{ width: 50, height: 50, borderRadius: 1.5 }}
                          >
                            {order.name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {order.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {order.telecaller || 'No Telecaller'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center', opacity: 0.6 }}>
                      <Typography variant="body2">No orders found</Typography>
                    </Box>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MonthlyOrders;