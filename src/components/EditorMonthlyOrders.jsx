import React, { useState, useEffect } from 'react';
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
    useTheme,
    CircularProgress,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { ArrowBack, CheckCircle, Pending, Autorenew } from '@mui/icons-material';
import { collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useOrders } from '../hooks/useOrders';

const EditorMonthlyOrders = ({
    editorEmail: propEmail,
    editorName: propName,
    month: propMonth,
    year: propYear,
    orders: propOrders,
    onBack
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();

    // Retrieve data passed from navigation (e.g., from Analytics)
    const state = location.state || {};
    const {
        editorEmail = propEmail || state.editorEmail,
        editorName = propName || state.editorName,
        month = propMonth !== undefined ? propMonth : (state.month !== undefined ? state.month : new Date().getMonth()),
        year = propYear !== undefined ? propYear : (state.year !== undefined ? state.year : new Date().getFullYear()),
        orders: passedOrders = propOrders || state.orders
    } = {};

    const [orders, setOrders] = useState(passedOrders || []);
    const [loading, setLoading] = useState(!passedOrders);
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [selectedYear, setSelectedYear] = useState(year);
    const [lifetimeStats, setLifetimeStats] = useState({ assigned: 0, completed: 0 });
    const { orders: allOrders } = useOrders();
    const [editorsList, setEditorsList] = useState([]);
    const [activeEditorEmail, setActiveEditorEmail] = useState(editorEmail || 'all');

    const monthName = selectedMonth === 'all'
        ? 'All Months'
        : new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });

    useEffect(() => {
        const q = query(collection(db, 'users'), where('role', '==', 'editor'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                email: doc.data().email,
                name: doc.data().displayName || doc.data().email,
                id: doc.id
            }));
            setEditorsList(list);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // If orders were passed via state and match selected date AND match selected editor (or initial load)
        // We check if activeEditorEmail matches the prop editorEmail (or 'all' if prop was missing)
        if (passedOrders && selectedMonth === month && selectedYear === year && activeEditorEmail === (editorEmail || 'all')) {
            setOrders(passedOrders);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Otherwise, fetch orders for the specified month
        const fetchOrders = async () => {
            try {
                let start, end;
                if (selectedMonth === 'all') {
                    start = new Date(selectedYear, 0, 1);
                    end = new Date(selectedYear, 11, 31, 23, 59, 59);
                } else {
                    start = new Date(selectedYear, selectedMonth, 1);
                    end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
                }

                const q = query(
                    collection(db, 'orders'),
                    where('createdAt', '>=', Timestamp.fromDate(start)),
                    where('createdAt', '<=', Timestamp.fromDate(end))
                );

                const snap = await getDocs(q);
                const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Filter by editor if an email is provided
                const filteredOrders = (activeEditorEmail && activeEditorEmail !== 'all')
                    ? allOrders.filter(o => o.assignedEditorEmails?.includes(activeEditorEmail))
                    : allOrders;

                setOrders(filteredOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [selectedMonth, selectedYear, activeEditorEmail, passedOrders, month, year, editorEmail]);

    useEffect(() => {
        if (!allOrders) return;

        let assigned = 0;
        let completed = 0;

        if (activeEditorEmail === 'all') {
            assigned = allOrders.length;
            completed = allOrders.filter(o => o.status === 'completed').length;
        } else {
            assigned = allOrders.filter(o => o.assignedEditorEmails?.includes(activeEditorEmail)).length;
            completed = allOrders.filter(o => o.assignedEditorEmails?.includes(activeEditorEmail) && o.status === 'completed').length;
        }

        setLifetimeStats({ assigned, completed });
    }, [activeEditorEmail, allOrders]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const totalAssigned = orders.length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    const inProgressCount = orders.filter(o => o.status === 'in-progress').length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    const currentEditorName = activeEditorEmail === 'all'
        ? 'All Editors'
        : (editorsList.find(e => e.email === activeEditorEmail)?.name || activeEditorEmail);

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            p: { xs: 2, md: 4, width: '79vw' },
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={handleBack} sx={{ mr: 2, bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                            {activeEditorEmail !== 'all' ? `${currentEditorName}'s Orders` : 'All Monthly Orders'}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            {monthName} {selectedYear}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
                        <InputLabel>Editor</InputLabel>
                        <Select
                            value={activeEditorEmail}
                            label="Editor"
                            onChange={(e) => setActiveEditorEmail(e.target.value)}
                        >
                            <MenuItem value="all">All Editors</MenuItem>
                            {editorsList.map((editor) => (
                                <MenuItem key={editor.id} value={editor.email}>{editor.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            {Array.from({ length: 12 }, (_, i) => (
                                <MenuItem key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            {[year - 1, year, year + 1].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Lifetime Stats */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>Lifetime Performance ({activeEditorEmail === 'all' ? 'Team' : currentEditorName})</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={6}>
                        <Card sx={{ bgcolor: 'rgba(240, 244, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h4" fontWeight="bold" color="primary.main">{lifetimeStats.assigned}</Typography>
                                <Typography variant="body2" color="textSecondary">Total Assigned (All Time)</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                        <Card sx={{ bgcolor: 'rgba(232, 245, 233, 0.8)', backdropFilter: 'blur(10px)' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h4" fontWeight="bold" color="success.main">{lifetimeStats.completed}</Typography>
                                <Typography variant="body2" color="textSecondary">Total Completed (All Time)</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#555' }}>{monthName} Overview</Typography>
            {/* Summary Counts */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="h4" fontWeight="bold">{totalAssigned}</Typography>
                            <Typography variant="body2" color="textSecondary">Total Assigned</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="h4" fontWeight="bold" color="success.main">{completedCount}</Typography>
                            <Typography variant="body2" color="textSecondary">Completed</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="h4" fontWeight="bold" color="info.main">{inProgressCount}</Typography>
                            <Typography variant="body2" color="textSecondary">In Progress</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">{pendingCount}</Typography>
                            <Typography variant="body2" color="textSecondary">Pending</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {sections.map((section) => (
                    <Paper key={section.title} sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            {section.icon}
                            <Typography variant="h6" fontWeight="bold">
                                {section.title} ({section.items.length})
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        <List>
                            {section.items.length > 0 ? (
                                section.items.map((order) => (
                                    <ListItem key={order.id} sx={{ mb: 1, bgcolor: 'white', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', '&:hover': { bgcolor: '#f8f9fa' } }}>
                                        <ListItemAvatar>
                                            <Avatar variant="rounded" src={order.sampleImageUrl || order.image} alt={order.name}>
                                                {order.name?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="subtitle2" fontWeight="bold">{order.name}</Typography>}
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', gap: 2, fontSize: '0.8rem' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Telecaller: {order.telecaller || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <Chip label={order.status} size="small" sx={{ bgcolor: section.color, color: 'white', textTransform: 'capitalize' }} />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No orders in this section.
                                </Typography>
                            )}
                        </List>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};

export default EditorMonthlyOrders;