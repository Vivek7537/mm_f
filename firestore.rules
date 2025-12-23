// src/components/OrderDetails.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../hooks/useOrder';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Chip,
    Paper,
    Grid,
    Button,
    CardMedia
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const statusColors = {
    pending: 'warning',
    'in-progress': 'info',
    completed: 'success',
};

const OrderDetails = () => {
    const { orderId } = useParams();
    const { order, loading } = useOrder(orderId);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (!order) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5">Order not found</Typography>
                <Button component={Link} to="/dashboard" variant="contained" sx={{ mt: 2 }}>
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto' }}>
            <Button component={Link} to="/dashboard" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                Back to Orders
            </Button>
            <Typography variant="h4" gutterBottom>
                Order Details
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    {order.sampleImageUrl ? (
                        <CardMedia
                            component="img"
                            image={order.sampleImageUrl}
                            alt={`Image for ${order.name}`}
                            sx={{
                                width: '100%',
                                borderRadius: 2,
                                border: '1px solid #ddd'
                            }}
                        />
                    ) : (
                        <Box sx={{ 
                            height: 300, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: 2 
                        }}>
                            <Typography color="text.secondary">No Image Found</Typography>
                        </Box>
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h5" component="div" gutterBottom>
                                {order.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>Status:</Typography>
                                <Chip
                                    label={order.status}
                                    color={statusColors[order.status] || 'default'}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Box>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                <strong>Order ID:</strong> {order.id}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                <strong>WhatsApp:</strong> {order.whatsapp}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                <strong>Country:</strong> {order.country}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                <strong>Telecaller:</strong> {order.telecaller}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                <strong>Assigned To:</strong> {order.assignedToName || 'Unassigned'}
                            </Typography>
                            <Typography color="text.secondary">
                                <strong>Created At:</strong> {order.createdAt?.toDate().toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default OrderDetails;
