import React from 'react';
import { Box, Paper, Typography, Grid, Divider } from '@mui/material';
import { Assignment, CheckCircle, Pending, Autorenew } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
    <Paper sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)' }
    }}>
        <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: color, mt: 0.5 }}>
                {value}
            </Typography>
        </Box>
        <Box sx={{
            p: 1.5,
            borderRadius: '50%',
            bgcolor: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </Box>
    </Paper>
);

const EditorStats = ({ orders, userEmail }) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Helper to check if order is completed by this user
    const isCompletedByUser = (order) => {
        const isShared = order.assignedEditorEmails?.length > 1;
        if (isShared) {
            return order.completedBy?.includes(userEmail) || order.status === 'completed';
        }
        return order.status === 'completed';
    };

    // Lifetime Stats
    const lifetimeTotal = orders.length;
    const lifetimeCompleted = orders.filter(o => isCompletedByUser(o)).length;
    const lifetimePending = orders.filter(o => o.status === 'pending').length;
    const lifetimeInProgress = orders.filter(o => o.status === 'in-progress' && !isCompletedByUser(o)).length;

    // Monthly Stats
    const monthlyOrders = orders.filter(order => {
        const d = order.createdAt?.toDate ? order.createdAt.toDate() : null;
        return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyTotal = monthlyOrders.length;
    const monthlyCompleted = monthlyOrders.filter(o => isCompletedByUser(o)).length;
    const monthlyPending = monthlyOrders.filter(o => o.status === 'pending').length;
    const monthlyInProgress = monthlyOrders.filter(o => o.status === 'in-progress' && !isCompletedByUser(o)).length;

    return (
        <Box mb={4}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #fff 0%, #f5f7fa 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
                    Lifetime Overview
                </Typography>
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="Total Orders" value={lifetimeTotal} icon={<Assignment fontSize="medium" />} color="#667eea" /></Grid>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="Completed" value={lifetimeCompleted} icon={<CheckCircle fontSize="medium" />} color="#4caf50" /></Grid>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="In Progress" value={lifetimeInProgress} icon={<Autorenew fontSize="medium" />} color="#ff9800" /></Grid>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="Pending" value={lifetimePending} icon={<Pending fontSize="medium" />} color="#f44336" /></Grid>
                </Grid>

                <Divider sx={{ my: 3, opacity: 0.6 }} />

                <Typography variant="h6" fontWeight={700} gutterBottom color="primary">
                    Current Month ({new Date().toLocaleString('default', { month: 'long' })})
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="Total" value={monthlyTotal} icon={<Assignment fontSize="medium" />} color="#667eea" /></Grid>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="Completed" value={monthlyCompleted} icon={<CheckCircle fontSize="medium" />} color="#4caf50" /></Grid>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="In Progress" value={monthlyInProgress} icon={<Autorenew fontSize="medium" />} color="#ff9800" /></Grid>
                    <Grid item xs={6} sm={6} md={3}><StatCard title="Pending" value={monthlyPending} icon={<Pending fontSize="medium" />} color="#f44336" /></Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default EditorStats;