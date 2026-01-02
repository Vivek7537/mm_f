import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, useTheme } from '@mui/material';
import { Assignment, CheckCircle, Autorenew, DateRange, Timeline } from '@mui/icons-material';

const EditorMonthlySummary = () => {
    const { user } = useAuth();
    const { orders, loading } = useOrders();
    const theme = useTheme();

    const stats = useMemo(() => {
        if (!orders || !user) return {
            lifetimeAssigned: 0,
            lifetimeCompleted: 0,
            monthAssigned: 0,
            monthCompleted: 0,
            monthInProgress: 0
        };

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let lifetimeAssigned = 0;
        let lifetimeCompleted = 0;
        let monthAssigned = 0;
        let monthCompleted = 0;
        let monthInProgress = 0;

        orders.forEach(order => {
            // Check if assigned to current user
            if (order.assignedEditorEmails?.includes(user.email)) {
                lifetimeAssigned++;

                const isShared = order.assignedEditorEmails?.length > 1;
                const isCompleted = isShared
                    ? (order.completedBy?.includes(user.email) || order.status === 'completed')
                    : order.status === 'completed';

                if (isCompleted) {
                    lifetimeCompleted++;
                }

                const created = order.createdAt?.toDate ? order.createdAt.toDate() : null;
                if (created && created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
                    monthAssigned++;
                    if (isCompleted) {
                        monthCompleted++;
                    }
                    if (order.status === 'in-progress') {
                        monthInProgress++;
                    }
                }
            }
        });

        return {
            lifetimeAssigned,
            lifetimeCompleted,
            monthAssigned,
            monthCompleted,
            monthInProgress
        };
    }, [orders, user]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card sx={{
            height: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
        }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography color="textSecondary" variant="subtitle2" fontWeight="bold" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="textSecondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}15`, color: color, display: 'flex' }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '100%' }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>My Performance Summary</Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Lifetime Stats */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timeline color="primary" /> Lifetime Statistics
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}><StatCard title="Total Assigned" value={stats.lifetimeAssigned} icon={<Assignment fontSize="large" />} color={theme.palette.primary.main} subtitle="All time assigned orders" /></Grid>
                        <Grid item xs={12} sm={6}><StatCard title="Total Completed" value={stats.lifetimeCompleted} icon={<CheckCircle fontSize="large" />} color={theme.palette.success.main} subtitle="All time completed orders" /></Grid>
                    </Grid>
                </Grid>

                {/* Monthly Stats */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}><DateRange color="secondary" /> Current Month ({new Date().toLocaleString('default', { month: 'long' })})</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}><StatCard title="Assigned This Month" value={stats.monthAssigned} icon={<Assignment fontSize="large" />} color={theme.palette.info.main} /></Grid>
                        <Grid item xs={12} sm={4}><StatCard title="Completed This Month" value={stats.monthCompleted} icon={<CheckCircle fontSize="large" />} color={theme.palette.success.main} /></Grid>
                        <Grid item xs={12} sm={4}><StatCard title="In Progress" value={stats.monthInProgress} icon={<Autorenew fontSize="large" />} color={theme.palette.warning.main} /></Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EditorMonthlySummary;