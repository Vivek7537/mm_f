// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Box,
    useMediaQuery,
    useTheme,
    Avatar,
    CssBaseline,
    Chip,
    Badge,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Add as AddIcon,
    List as ListIcon,
    Assessment as AssessmentIcon,
    Logout as LogoutIcon,
    Build as BuildIcon,
} from '@mui/icons-material';
import Analytics from './Analytics';
import OrderForm from './OrderForm';
import OrdersList from './OrdersList';
import EditorDashboard from './EditorDashboard';
import EditorInsights from './EditorInsights';


const drawerWidth = 240;

const Dashboard = () => {
    const { user, role, logout, isTeamLeader, isEditor } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [currentView, setCurrentView] = useState(isTeamLeader ? 'analytics' : 'orders');
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (isTeamLeader || !user?.email) return;

        const q = query(
            collection(db, 'orders'),
            where('assignedEditorEmails', 'array-contains', user.email),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user, isTeamLeader]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = isTeamLeader ? [
        { text: 'Dashboard', icon: <DashboardIcon />, view: 'analytics' },
        { text: 'Orders', icon: <ListIcon />, view: 'orders' },
        { text: 'New Order', icon: <AddIcon />, view: 'create' },
        { text: 'Performance', icon: <AssessmentIcon />, view: 'performance' },

    ] : [
        {
            text: 'My Tasks',
            icon: (
                <Badge badgeContent={pendingCount} color="error">
                    <ListIcon />
                </Badge>
            ),
            view: 'orders'
        },
    ];

    const renderView = () => {
        switch (currentView) {
            case 'analytics':
                return <Analytics onNavigateToPerformance={() => setCurrentView('performance')} />;
            case 'create':
                return <OrderForm onOrderCreated={() => setCurrentView('orders')} />;
            case 'orders':
                return isTeamLeader ? <OrdersList /> : <EditorDashboard />;
            case 'performance':
                return <EditorInsights />;
            case 'migration':
                return <MigrationTool />;
            default:
                return <div>Select a view</div>;
        }
    };

    const currentViewTitle = menuItems.find(item => item.view === currentView)?.text || 'Dashboard';

    const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const currentDate = new Date().toLocaleDateString('en-GB', dateOptions);
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" noWrap component="div" sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                }}>
                    MomentMerge
                </Typography>
            </Toolbar>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <List sx={{ p: 2 }}>
                    {menuItems.map((item) => (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => { setCurrentView(item.view); if (isMobile) setMobileOpen(false); }}
                            sx={{
                                mb: 1,
                                borderRadius: '8px',
                                color: currentView === item.view ? 'white' : 'text.secondary',
                                background: currentView === item.view ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                                boxShadow: currentView === item.view ? '0 4px 12px 0 rgba(118, 75, 162, 0.3)' : 'none',
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                    backgroundColor: currentView !== item.view ? 'rgba(102, 126, 234, 0.05)' : undefined,
                                    transform: currentView === item.view ? 'translateY(-2px)' : 'none',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    '& .MuiListItemText-primary': {
                                        fontWeight: currentView === item.view ? 600 : 500,
                                    },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Box sx={{ p: 2 }}>
                <ListItem button onClick={handleLogout} sx={{ borderRadius: '8px', '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.05)' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                    color: 'white',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 700 }}>
                        {currentViewTitle}
                    </Typography>
                    <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {currentDate}
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                            {formattedName}
                        </Typography>
                        <Chip
                            label={role === 'team-leader' ? 'Team Leader' : 'Editor'}
                            variant="outlined"
                            size="small"
                            sx={{
                                fontWeight: 600,
                                display: { xs: 'none', sm: 'flex' },
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                        />
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                            {user?.email?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
                    open={isMobile ? mobileOpen : true}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: 'none',
                            backgroundColor: 'background.paper',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1.5, sm: 3 },
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    backgroundColor: '#f4f6f8', // A soft, modern background color
                }}
            >
                <Toolbar />
                {renderView()}
            </Box>
        </Box>
    );
};

export default Dashboard;