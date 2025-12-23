import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Chip,
    CircularProgress,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Lock as LockIcon, Close as CloseIcon } from '@mui/icons-material';

const EditorDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State for confirmation dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmStep, setConfirmStep] = useState(0);
    const [targetOrder, setTargetOrder] = useState(null);

    // State for Details Modal
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (!user?.email) return;

        // Query orders where assignedEditorEmails contains the user's email
        const q = query(
            collection(db, 'orders'),
            where('assignedEditorEmails', 'array-contains', user.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Sort by createdAt descending (newest first)
            // Doing this client-side avoids complex Firestore composite index requirements
            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });

            setOrders(fetchedOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            toast.error("Error loading orders. Please check permissions.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleStatusChange = async (orderId, newStatus) => {
        if (newStatus === 'completed') {
            setTargetOrder(orderId);
            setConfirmStep(1);
            setConfirmOpen(true);
        } else {
            await updateStatus(orderId, newStatus);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const order = orders.find(o => o.id === orderId);
            const isShared = order.assignedEditorEmails && order.assignedEditorEmails.length > 1;

            let updateData = {};

            if (isShared) {
                if (newStatus === 'completed') {
                    // Add user to completedBy array
                    updateData.completedBy = arrayUnion(user.email);

                    // Check if this action completes the order for everyone
                    const currentCompleted = order.completedBy || [];
                    // We use a Set to count unique completed emails including the current user
                    const uniqueCompleted = new Set([...currentCompleted, user.email]);

                    if (uniqueCompleted.size >= order.assignedEditorEmails.length) {
                        updateData.status = 'completed';
                        updateData.completedAt = serverTimestamp();
                    } else {
                        updateData.status = 'in-progress';
                        updateData.completedAt = null;
                    }
                } else {
                    // Reverting to pending or in-progress
                    updateData.completedBy = arrayRemove(user.email);

                    // If other editors have completed it, keep global status as in-progress
                    const currentCompleted = order.completedBy || [];
                    const othersCompleted = currentCompleted.filter(email => email !== user.email);

                    updateData.status = othersCompleted.length > 0 ? 'in-progress' : newStatus;
                    updateData.completedAt = null;
                }
            } else {
                // Single editor logic
                updateData.status = newStatus;
                updateData.completedAt = newStatus === 'completed' ? serverTimestamp() : null;
            }

            await updateDoc(orderRef, updateData);
            toast.success(`Order status updated to ${newStatus}`);
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update status");
        }
    };

    const handleConfirm = () => {
        if (confirmStep === 1) {
            setConfirmStep(2);
        } else {
            updateStatus(targetOrder, 'completed');
            handleClose();
        }
    };

    const handleClose = () => {
        setConfirmOpen(false);
        setConfirmStep(0);
        setTargetOrder(null);
    };

    const handleOpenDetails = (order) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedOrder(null);
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'active') return order.status !== 'completed';
        return order.status === 'completed';
    });

    const getEditorStatus = (order) => {
        const isShared = order.assignedEditorEmails?.length > 1;
        if (isShared) {
            if (order.completedBy?.includes(user.email)) return 'completed';
            if (order.status === 'completed') return 'completed';
            return order.status;
        }
        return order.status;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" fontWeight={700} mb={4}>
                My Tasks
            </Typography>

            <Box mb={4}>
                <ToggleButtonGroup
                    color="primary"
                    value={filter}
                    exclusive
                    onChange={(e, newFilter) => {
                        if (newFilter !== null) setFilter(newFilter);
                    }}
                    aria-label="Order Status Filter"
                >
                    <ToggleButton value="active">Active</ToggleButton>
                    <ToggleButton value="completed">Completed</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {filteredOrders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        {orders.length === 0 ? "No orders assigned to you yet." : `No ${filter} orders found.`}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredOrders.map((order) => (
                        <Grid item xs={12} md={6} lg={4} key={order.id}>
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    height: 560, // Fixed height for consistency across all devices
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between', // Distribute space
                                    transition: 'transform 0.2s',
                                    bgcolor: getEditorStatus(order) === 'completed' ? '#e8f5e9' : 'background.paper',
                                    border: getEditorStatus(order) === 'completed' ? '2px solid #4caf50' : 'none',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                    },
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                                <InputLabel id={`status-label-${order.id}`}>Status</InputLabel>
                                                <Select
                                                    labelId={`status-label-${order.id}`}
                                                    value={getEditorStatus(order)}
                                                    label="Status"
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    sx={{ bgcolor: 'background.paper' }}
                                                    disabled={getEditorStatus(order) === 'completed'}
                                                >
                                                    <MenuItem value="pending" disabled>Pending</MenuItem>
                                                    <MenuItem value="in-progress">In-Progress</MenuItem>
                                                    <MenuItem value="completed">Completed</MenuItem>
                                                </Select>
                                            </FormControl>
                                            {getEditorStatus(order) === 'completed' && (
                                                <Tooltip title="Status is locked">
                                                    <LockIcon color="action" fontSize="small" />
                                                </Tooltip>
                                            )}
                                        </Box>
                                        {getEditorStatus(order) === 'completed' && order.status !== 'completed' && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                                Waiting for others
                                            </Typography>
                                        )}
                                    </Box>
                                    {order.assignedEditorEmails?.length > 1 && (
                                        <Chip
                                            label="SHARED"
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                fontSize: '0.7rem',
                                                height: 24,
                                                color: '#9C27B0',
                                                borderColor: '#9C27B0'
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Image Container with Fixed Height */}
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 200, // Fixed image height
                                        mb: 1.5,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: '#f5f5f5',
                                        flexShrink: 0
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={order.sampleImageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
                                        alt="Order Sample"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </Box>

                                {/* Content Area */}
                                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {order.name}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" mb={0.5} sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        <strong>Telecaller:</strong> {order.telecaller}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </Typography>

                                    {/* Remark Section - Fixed height container with truncation */}
                                    <Box sx={{ mb: 2, overflow: 'hidden' }}>
                                        {order.remark && (
                                            <Typography variant="body2" sx={{
                                                fontStyle: 'italic',
                                                color: 'text.secondary',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                bgcolor: '#fff8e1',
                                                p: 1,
                                                borderRadius: 1,
                                            }}>
                                                Remark: {order.remark}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => handleOpenDetails(order)}
                                    sx={{
                                        mt: 'auto', // Ensures button stays at bottom
                                        background: 'linear-gradient(135deg,#667eea,#764ba2)',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    View Details
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={handleClose}>
                <DialogTitle>
                    {confirmStep === 1 ? "Mark Order as Completed?" : "Final Confirmation"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmStep === 1
                            ? "Are you sure you want to mark this order as completed? This indicates the work is finished."
                            : "Please confirm again. Are you absolutely sure the order is complete and ready for delivery?"}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button onClick={handleConfirm} color={confirmStep === 1 ? "primary" : "success"} variant="contained">
                        {confirmStep === 1 ? "Proceed" : "Yes, Complete Order"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Details Modal */}
            <Dialog
                open={detailsOpen}
                onClose={handleCloseDetails}
                fullScreen={isMobile}
                maxWidth="md"
                fullWidth
                scroll="paper"
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                    Order Details
                    <IconButton onClick={handleCloseDetails}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedOrder && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box
                                    component="img"
                                    src={selectedOrder.sampleImageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
                                    alt={selectedOrder.name}
                                    sx={{
                                        width: '100%',
                                        borderRadius: 2,
                                        maxHeight: 400,
                                        objectFit: 'contain',
                                        bgcolor: '#f5f5f5'
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    {selectedOrder.name}
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        label={selectedOrder.status.toUpperCase()}
                                        color={selectedOrder.status === 'completed' ? 'success' : 'warning'}
                                        size="small"
                                        sx={{ fontWeight: 'bold', mr: 1 }}
                                    />
                                    {selectedOrder.assignedEditorEmails?.length > 1 && (
                                        <Chip label="SHARED" size="small" variant="outlined" sx={{ color: '#9C27B0', borderColor: '#9C27B0' }} />
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                        Telecaller
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedOrder.telecaller}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                        Created Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString() : 'N/A'}
                                    </Typography>
                                </Box>

                                {selectedOrder.completedAt && (
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                            Completed Date
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedOrder.completedAt.toDate().toLocaleString()}
                                        </Typography>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                        Assigned Editors
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedOrder.assignedEditorNames?.join(', ') || 'N/A'}
                                    </Typography>
                                </Box>

                                {selectedOrder.remark && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff8e1', borderRadius: 2, border: '1px dashed #ffe0b2' }}>
                                        <Typography variant="subtitle2" fontWeight={800} color="warning.dark" gutterBottom>
                                            REMARKS
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedOrder.remark}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetails} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default EditorDashboard;