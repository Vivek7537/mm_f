// src/components/Analytics.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useEditorStats } from '../context/EditorStatsContext';
import { Card, CardContent, Typography, Grid, Box, Select, MenuItem, FormControl, InputLabel, Button, Chip, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import {
    ShoppingCart as TotalIcon,
    CalendarToday as MonthlyIcon,
    Schedule as TimeIcon,
    Pending as PendingIcon,
    People as PeopleIcon,
    TrendingUp as TrendingUpIcon,
    Group as GroupIcon,
} from '@mui/icons-material';

const Analytics = ({ onNavigateToPerformance }) => {
    const { orders, loading: ordersLoading } = useOrders();
    const { editorStats, loading: statsLoading } = useEditorStats();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const navigate = useNavigate();

    if (ordersLoading || statsLoading) return <div>Loading...</div>;

    const totalOrders = orders.length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyOrders = orders.filter(o => {
        const created = o.createdAt?.toDate();
        return created && created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    });
    const ordersThisMonth = monthlyOrders.length;

    // Calculate all stats from live `orders` data for consistency
    const performanceData = editorStats.map(editor => {
        const editorOrders = orders.filter(o => o.assignedEditorEmails?.includes(editor.email));
        return {
            email: editor.email,
            name: editor.name || editor.email.split('@')[0],
            assigned: editorOrders.length,
            completed: editorOrders.filter(o => o.status === 'completed').length,
            pending: editorOrders.filter(o => o.status === 'pending' || o.status === 'in-progress').length,
        };
    });

    const avgCompletionTime = () => {
        // Calculate from editor stats if available, otherwise fallback to orders
        const totalCompleted = editorStats.reduce((sum, editor) => sum + (editor.totalCompleted || 0), 0);
        if (totalCompleted === 0) return 0;

        // Use average turnaround time from editor stats
        const totalTurnaround = editorStats.reduce((sum, editor) => {
            const avgHours = editor.monthlyStats ?
                Object.values(editor.monthlyStats).reduce((monthSum, month) => monthSum + (month.avgTurnaround || 0), 0) /
                Object.keys(editor.monthlyStats).length : 0;
            return sum + (avgHours * (editor.totalCompleted || 0));
        }, 0);

        return Math.round((totalTurnaround / totalCompleted) / 24); // Convert hours to days
    };

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
        orders: orders.filter(o => o.createdAt?.toDate().getMonth() === i && o.createdAt?.toDate().getFullYear() === currentYear).length
    }));

    const pendingData = performanceData.filter(item => item.pending > 0);

    // Calculate team performance metrics from live data
    const totalCompleted = orders.filter(o => o.status === 'completed').length;
    const totalAssignedForRate = orders.length; // Using total orders as the base for completion rate
    const totalWorkload = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
    const completionRate = totalAssignedForRate > 0 ? Math.round((totalCompleted / totalAssignedForRate) * 100) : 0;

    const totalSharedOrders = orders.filter(o => o.assignedEditorEmails?.length > 1).length;
    const sharedWorkload = orders.filter(o => o.assignedEditorEmails?.length > 1 && (o.status === 'pending' || o.status === 'in-progress')).length;
    const inProgressCount = orders.filter(o => o.status === 'in-progress').length;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>Dashboard</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onNavigateToPerformance}
                    sx={{ borderRadius: 2 }}
                >
                    View Detailed Performance
                </Button>
            </Box>

            {/* {------------startttttt} */}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#E3F2FD', borderLeft: '4px solid #2196F3' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <TotalIcon sx={{ fontSize: 40, color: '#2196F3', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Total Orders</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalOrders}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{ backgroundColor: '#F3E5F5', borderLeft: '4px solid #9C27B0', cursor: 'pointer' }}
                        onClick={() => navigate('/orders/monthly', { state: { orders: monthlyOrders, month: currentMonth, year: currentYear } })}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <MonthlyIcon sx={{ fontSize: 40, color: '#9C27B0', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Orders This Month</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{ordersThisMonth}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#FFF3E0', borderLeft: '4px solid #FF9800' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <PendingIcon sx={{ fontSize: 40, color: '#FF9800', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Pending Orders</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{orders.filter(o => o.status === 'pending').length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#E8F5E8', borderLeft: '4px solid #4CAF50' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <TimeIcon sx={{ fontSize: 40, color: '#4CAF50', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Completed Orders</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalCompleted}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#E3F2FD', borderLeft: '4px solid #1976D2' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <TrendingUpIcon sx={{ fontSize: 40, color: '#1976D2', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>In-Progress</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{inProgressCount}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#E0F7FA', borderLeft: '4px solid #00BCD4' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <GroupIcon sx={{ fontSize: 40, color: '#00BCD4', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Total Shared</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalSharedOrders}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#E1F5FE', borderLeft: '4px solid #0288D1' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <GroupIcon sx={{ fontSize: 40, color: '#0288D1', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Shared Workload</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{sharedWorkload}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>

            {/* Shared Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>

            </Grid>

            {/* {endd-----------} */}
            {/* Editor Performance Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#F1F8E9', borderLeft: '4px solid #8BC34A' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <PeopleIcon sx={{ fontSize: 40, color: '#8BC34A', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Active Editors</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{editorStats.length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#FFF8E1', borderLeft: '4px solid #FFC107' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TrendingUpIcon sx={{ fontSize: 40, color: '#FFC107', mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>Completion Rate</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{completionRate}%</Typography>
                                </Box>
                            </Box>
                            {/* <LinearProgress variant="determinate" value={completionRate} sx={{ height: 8, borderRadius: 4 }} color="warning" /> */}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: '#FFEBEE', borderLeft: '4px solid #F44336' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <PendingIcon sx={{ fontSize: 40, color: '#F44336', mr: 2 }} />
                            <Box>
                                <Typography color="textSecondary" gutterBottom>Current Workload</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalWorkload}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>

            {/* Analytics Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Editor Performance</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="assigned" fill="#8884d8" />
                                <Bar dataKey="completed" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Pending Orders by Editor</Typography>
                        <Box sx={{ mt: 2 }}>
                            {pendingData.map((item) => (
                                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography>{item.name}</Typography>
                                    <Typography sx={{ color: '#FF9800', fontWeight: 'bold' }}>{item.pending}</Typography>
                                </Box>
                            ))}
                            {pendingData.length === 0 && (
                                <Typography color="textSecondary">No pending orders</Typography>
                            )}
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Editor Status Overview */}
            <Card sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Editor Status Overview</Typography>
                <Grid container spacing={2}>
                    {performanceData.map((editor) => {
                        const workloadPercentage = editor.assigned > 0 ?
                            Math.min((editor.pending / editor.assigned) * 100, 100) : 0;
                        const editorCompletionRate = editor.assigned > 0 ?
                            Math.round((editor.completed / editor.assigned) * 100) : 0;

                        return (
                            <Grid item xs={12} sm={6} md={3} key={editor.email}>
                                <Card variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {editor.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Workload</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {editor.pending}/{editor.assigned}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={workloadPercentage}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: '#e0e0e0',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: workloadPercentage > 80 ? '#f44336' :
                                                        workloadPercentage > 60 ? '#ff9800' : '#4caf50'
                                                }
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
                                            <Typography variant="h6" sx={{
                                                color: editorCompletionRate >= 80 ? 'success.main' :
                                                    editorCompletionRate >= 60 ? 'warning.main' : 'error.main'
                                            }}>
                                                {editorCompletionRate}%
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={editor.pending > 5 ? 'Busy' :
                                                editor.pending > 2 ? 'Active' : 'Available'}
                                            size="small"
                                            color={editor.pending > 5 ? 'error' :
                                                editor.pending > 2 ? 'warning' : 'success'}
                                            variant="outlined"
                                        />
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Card>

            {/* Monthly Orders Graph */}
            <Card sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Monthly Orders</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <MenuItem key={i} value={i}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Box>
    );
};

export default Analytics;