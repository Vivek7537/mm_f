// src/components/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useEditorStats } from '../context/EditorStatsContext';
import { Card, CardContent, Typography, Grid, Box, Select, MenuItem, FormControl, InputLabel, Button, Chip, LinearProgress, Avatar, Tooltip as MuiTooltip, IconButton, Menu } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ShoppingCart as TotalIcon,
    CalendarToday as MonthlyIcon,
    Schedule as TimeIcon,
    Pending as PendingIcon,
    People as PeopleIcon,
    TrendingUp as TrendingUpIcon,

    Group as GroupIcon,
    EmojiEvents as TrophyIcon,
    Brightness4,
    Brightness7,
    FilterList as FilterListIcon,
} from '@mui/icons-material';

const Analytics = ({ onNavigateToPerformance, onEditorClick }) => {
    const { orders, loading: ordersLoading } = useOrders();
    const { editorStats, loading: statsLoading } = useEditorStats();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [editors, setEditors] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [barChartFilter, setBarChartFilter] = useState('month');
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'editor'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const editorsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEditors(editorsList);
        });
        return () => unsubscribe();
    }, []);

    const targetStats = React.useMemo(() => {
        if (!orders) return [];
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return editors
            .filter(e => e.targets && e.targets[currentMonthKey] > 0)
            .map((editor, index) => {
                const target = editor.targets[currentMonthKey];
                const completedCount = orders.filter(o => {
                    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : null;
                    if (!orderDate) return false;
                    if (orderDate.getMonth() !== currentMonth || orderDate.getFullYear() !== currentYear) return false;

                    if (!o.assignedEditorEmails?.includes(editor.email)) return false;

                    if (o.assignedEditorEmails.length > 1) {
                        return o.completedBy?.includes(editor.email);
                    }

                    return o.status === 'completed';
                }).length;

                return {
                    id: editor.id,
                    name: editor.displayName || editor.email.split('@')[0],
                    target,
                    completed: completedCount,
                    progress: Math.min((completedCount / target) * 100, 100),
                    colorIndex: index
                };
            });
    }, [editors, orders]);

    const barChartData = React.useMemo(() => {
        if (!orders || !editors) return [];

        const now = new Date();
        let startDate = new Date(0);

        switch (barChartFilter) {
            case 'week':
                startDate = new Date();
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }

        const filteredOrders = orders.filter(o => {
            const created = o.createdAt?.toDate();
            return created && created >= startDate;
        });

        return editors.map(editor => {
            const editorOrders = filteredOrders.filter(o => o.assignedEditorEmails?.includes(editor.email));
            return {
                name: editor.displayName || editor.email.split('@')[0],
                assigned: editorOrders.length,
                completed: editorOrders.filter(o => o.status === 'completed').length,
            };
        });
    }, [orders, editors, barChartFilter]);

    if (ordersLoading || statsLoading) return <div>Loading...</div>;

    const totalOrders = orders.length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyOrders = orders.filter(o => {
        const created = o.createdAt?.toDate();
        return created && created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    });
    const ordersThisMonth = monthlyOrders.length;

    const isNewEditor = (createdAt) => {
        if (createdAt === null) return true;
        if (!createdAt || !createdAt.seconds) return false;
        const joinedDate = new Date(createdAt.seconds * 1000);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joinedDate > thirtyDaysAgo;
    };

    // Calculate all stats from live `orders` and `editors` data for consistency
    const performanceData = editors.map(editor => {
        const editorOrders = orders.filter(o => o.assignedEditorEmails?.includes(editor.email));
        return {
            email: editor.email,
            name: editor.displayName || editor.email.split('@')[0],
            photoURL: editor.photoURL,
            createdAt: editor.createdAt,
            status: editor.status,
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

    const delayedOrders = orders.filter(o => {
        const created = o.createdAt?.toDate();
        if (!created) return false;
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return (o.status === 'pending' || o.status === 'in-progress') && created < threeDaysAgo;
    });

    // Calculate team performance metrics from live data
    const totalCompleted = orders.filter(o => o.status === 'completed').length;
    const totalAssignedForRate = orders.length; // Using total orders as the base for completion rate
    const totalWorkload = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
    const completionRate = totalAssignedForRate > 0 ? Math.round((totalCompleted / totalAssignedForRate) * 100) : 0;

    const totalSharedOrders = orders.filter(o => o.assignedEditorEmails?.length > 1).length;
    const sharedWorkload = orders.filter(o => o.assignedEditorEmails?.length > 1 && (o.status === 'pending' || o.status === 'in-progress')).length;
    const inProgressCount = orders.filter(o => o.status === 'in-progress').length;

    // Calculate Top Performer (Team-wide)
    const topPerformer = (() => {
        const thisMonthCompleted = orders.filter(o => {
            const date = o.completedAt?.toDate ? o.completedAt.toDate() : (o.createdAt?.toDate ? o.createdAt.toDate() : null);
            return o.status === 'completed' &&
                date &&
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear;
        });

        const counts = {};
        thisMonthCompleted.forEach(o => {
            const contributors = (o.completedBy && o.completedBy.length > 0) ? o.completedBy : o.assignedEditorEmails;
            contributors?.forEach(email => {
                counts[email] = (counts[email] || 0) + 1;
            });
        });

        let topEmail = '';
        let maxOrders = -1;

        Object.entries(counts).forEach(([email, count]) => {
            if (count > maxOrders) {
                maxOrders = count;
                topEmail = email;
            }
        });

        if (!topEmail) return null;

        const editor = editors.find(e => e.email === topEmail);
        return {
            name: editor?.displayName || topEmail.split('@')[0],
            count: maxOrders,
            photoURL: editor?.photoURL
        };
    })();

    const getEditorColor = (index) => {
        const colors = ['#2196f3', '#9c27b0', '#009688', '#ff9800', '#f44336', '#3f51b5', '#e91e63', '#795548'];
        return colors[index % colors.length];
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>Dashboard</Typography>
                    {/* <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
                        {darkMode ? <Brightness7 /> : <Brightness4 />}
                    </IconButton> */}
                </Box>
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
                <Grid item xs={6} sm={6} md={4}>
                    <Card sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, width: { xs: '93vw', md: '100%', sm: '100%' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(33, 150, 243, 0.1)', mr: 2, display: 'flex' }}>
                                <TotalIcon sx={{ fontSize: 32, color: '#2196F3' }} />
                            </Box>
                            <Box>
                                <Typography color="textSecondary" variant="subtitle2" fontWeight="600">Total Orders</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalOrders}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={6} md={4}>
                    <Card
                        sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' }, width: { xs: '93vw', md: '100%', sm: '100%' } }}
                        onClick={() => navigate('/orders/monthly', { state: { orders: monthlyOrders, month: currentMonth, year: currentYear } })}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(156, 39, 176, 0.1)', mr: 2, display: 'flex' }}>
                                <MonthlyIcon sx={{ fontSize: 32, color: '#9C27B0' }} />
                            </Box>
                            <Box>
                                <Typography color="textSecondary" variant="subtitle2" fontWeight="600">Orders This Month</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{ordersThisMonth}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={6} md={4}>
                    <Card sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, width: { xs: '93vw', md: '100%', sm: '100%' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(255, 152, 0, 0.1)', mr: 2, display: 'flex' }}>
                                <PendingIcon sx={{ fontSize: 32, color: '#FF9800' }} />
                            </Box>
                            <Box>
                                <Typography color="textSecondary" variant="subtitle2" fontWeight="600">Pending Orders</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{orders.filter(o => o.status === 'pending').length}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, width: { xs: '93vw', md: '100%', sm: '100%' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(76, 175, 80, 0.1)', mr: 2, display: 'flex' }}>
                                <TimeIcon sx={{ fontSize: 32, color: '#4CAF50' }} />
                            </Box>
                            <Box>
                                <Typography color="textSecondary" variant="subtitle2" fontWeight="600">Completed Orders</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalCompleted}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, width: { xs: '93vw', md: '100%', sm: '100%' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(25, 118, 210, 0.1)', mr: 2, display: 'flex' }}>
                                <TrendingUpIcon sx={{ fontSize: 32, color: '#1976D2' }} />
                            </Box>
                            <Box>
                                <Typography color="textSecondary" variant="subtitle2" fontWeight="600">In-Progress</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{inProgressCount}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', borderRadius: 4, width: { xs: '93vw', md: '100%', sm: '100%' } }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(255, 215, 0, 0.1)', mr: 2, display: 'flex' }}>
                                <TrophyIcon sx={{ fontSize: 32, color: '#FFD700' }} />
                            </Box>
                            <Box>
                                <Typography color="textSecondary" variant="subtitle2" fontWeight="600">Top Performer</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                    {topPerformer ? topPerformer.name : 'N/A'}
                                </Typography>
                                {topPerformer && (
                                    <Typography variant="caption" color="textSecondary">
                                        {topPerformer.count} orders this month
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Editor Performance Summary Cards */}


            {/* Analytics Section */}
            <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
                <Grid item xs={12} md={12} lg={4}>
                    <Card sx={{
                        p: { xs: 2, md: 3 }, backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3, width: {
                            xs: '93vw',
                            sm: '100%',
                            md: '100%',
                        },
                    }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Editor Performance</Typography>
                            <IconButton size="small" onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                            <Menu
                                anchorEl={filterAnchorEl}
                                open={Boolean(filterAnchorEl)}
                                onClose={() => setFilterAnchorEl(null)}
                            >
                                <MenuItem onClick={() => { setBarChartFilter('week'); setFilterAnchorEl(null); }}>Weekly</MenuItem>
                                <MenuItem onClick={() => { setBarChartFilter('month'); setFilterAnchorEl(null); }}>Monthly</MenuItem>
                                <MenuItem onClick={() => { setBarChartFilter('quarter'); setFilterAnchorEl(null); }}>Quarterly</MenuItem>
                                <MenuItem onClick={() => { setBarChartFilter('year'); setFilterAnchorEl(null); }}>Yearly</MenuItem>
                                <MenuItem onClick={() => { setBarChartFilter('all'); setFilterAnchorEl(null); }}>All Time</MenuItem>
                            </Menu>
                        </Box>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barChartData}>
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
                <Grid item xs={12} md={6} lg={2}>
                    <Card sx={{
                        p: 3, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3, width: {
                            xs: '93vw',
                            sm: '100%',
                            md: '100%',
                        },
                    }}>
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
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{
                        p: 3, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid #ffcdd2',
                        width: {
                            xs: '93vw',
                            sm: '100%',
                            md: '100%',
                        },
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" color="error" sx={{ fontWeight: 'bold' }}>Delayed Orders &nbsp;</Typography>
                            <Chip label="  3 Days" color="error" size="small" />
                        </Box>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {delayedOrders.map((order) => (
                                <Card key={order.id} variant="outlined" sx={{ mb: 1.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.6)', borderColor: 'error.light' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ width: '70%' }}>
                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>{(order.name || order.id && assignedEditorEmails.email[0])}</Typography>
                                            {/* <Typography src={(editor?.photoURL) || (editor?.displayName?.[0] || email[0]).toUpperCase()}></Typography> */}
                                            {/* <Typography variant="caption" color="error" sx={{ fontWeight: 'bold', display: 'block' }}>Delayed</Typography> */}
                                            {/* <Box sx={{ display: 'flex', mt: 1 }}>
                                                {order.assignedEditorEmails?.map((email) => {
                                                    const editor = editors.find(e => e.email === email);
                                                    return (
                                                        <MuiTooltip key={email} title={editor?.displayName || email} arrow>
                                                            <Avatar src={editor?.photoURL} sx={{ width: 24, height: 24, mr: 0.5, fontSize: 10 }}>
                                                                {(!editor?.photoURL) && (editor?.displayName?.[0] || email[0]).toUpperCase()}
                                                            </Avatar>
                                                        </MuiTooltip>
                                                    );
                                                })}
                                            </Box> */}
                                        </Box>
                                        {(order.images?.[0] || order.image) && (
                                            <MuiTooltip
                                                title={<Box component="img" src={order.images?.[0] || order.image} sx={{ maxWidth: 200, borderRadius: 1 }} />}
                                                placement="left"
                                                arrow
                                            >
                                                <Avatar src={order.images?.[0] || order.image} variant="rounded" sx={{ width: 40, height: 40, border: '1px solid #ddd', cursor: 'pointer' }} />
                                            </MuiTooltip>
                                        )}
                                    </Box>
                                </Card>
                            ))}
                            {delayedOrders.length === 0 && (
                                <Typography variant="body2" color="textSecondary" align="center">No delayed orders</Typography>
                            )}
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <Card sx={{
                        p: 3, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3, width: {
                            xs: '93vw',
                            sm: '100%',
                            md: '120%',
                        },
                    }}>
                        <Typography variant="h6" gutterBottom>Monthly Targets</Typography>
                        <Box sx={{ mt: 2, maxHeight: 300, overflowY: 'auto' }}>
                            {targetStats.length === 0 ? (
                                <Typography color="textSecondary" variant="body2">No targets set for this month.</Typography>
                            ) : (
                                targetStats.map((stat) => (
                                    <Box key={stat.id} sx={{ mb: 2 }}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5} alignItems="flex-end">
                                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>{stat.name}</Typography>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary">{stat.completed} / {stat.target}</Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={stat.progress}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: 'red.200',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: getEditorColor(stat.colorIndex),
                                                    borderRadius: 4
                                                }
                                            }}
                                        />
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Editor Status Overview */}
            <Card sx={{ p: 3, mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Editor Status Overview</Typography>
                <Grid container spacing={2}>
                    {performanceData.map((editor) => {
                        const workloadPercentage = editor.assigned > 0 ?
                            Math.min((editor.pending / editor.assigned) * 100, 100) : 0;
                        const editorCompletionRate = editor.assigned > 0 ?
                            Math.round((editor.completed / editor.assigned) * 100) : 0;

                        return (
                            <Grid item xs={12} sm={6} md={3} key={editor.email}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        width: { xs: '80vw', md: '100%', sm: '100%' },
                                        p: 2,
                                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
                                    }}
                                    onClick={() => {
                                        const editorMonthlyOrders = orders.filter(o => {
                                            const d = o.createdAt?.toDate();
                                            return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.assignedEditorEmails?.includes(editor.email);
                                        });
                                        if (onEditorClick) {
                                            onEditorClick({ editorEmail: editor.email, editorName: editor.name, month: currentMonth, year: currentYear, orders: editorMonthlyOrders });
                                        } else {
                                            navigate('/orders/editor-monthly', { state: { editorEmail: editor.email, editorName: editor.name, month: currentMonth, year: currentYear, orders: editorMonthlyOrders } });
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        {editor.photoURL ? (
                                            <Avatar src={editor.photoURL} sx={{ width: 32, height: 32, mr: 1 }} />
                                        ) : (
                                            <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        )}
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {editor.name}
                                        </Typography>
                                        {isNewEditor(editor.createdAt) && <Chip label="NEW" color="primary" size="small" sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} />}
                                        {editor.status === 'Terminated' && <Chip label="Terminated" color="error" size="small" sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} />}
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
            <Card sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: 3 }}>
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