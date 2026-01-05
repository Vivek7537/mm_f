import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Paper, Tooltip } from '@mui/material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const MonthlyTargetProgress = ({ currentMonthCompleted }) => {
    const { user } = useAuth();
    const [target, setTarget] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setTarget(data.targets?.[currentMonthKey] || 0);
            }
            setLoading(false);
        });

        return () => unsubUser();
    }, [user]);

    if (loading || target === 0) return null;

    const progress = Math.min((currentMonthCompleted / target) * 100, 100);

    return (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, #e0f7fa 0%, #e1bee7 100%)', width: { xs: '85vw', sm: '90vw', md: '60vw' } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" color="primary.dark" fontWeight="bold">
                    Monthly Target
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                    {currentMonthCompleted} / {target} Orders
                </Typography>
            </Box>
            <Tooltip title={`${Math.round(progress)}% Completed`}>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: progress >= 100 ? '#4caf50' : '#2196f3'
                        }
                    }}
                />
            </Tooltip>
            {progress >= 100 && (
                <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    🎉 Target Achieved! Great work!
                </Typography>
            )}
        </Paper>
    );
};

export default MonthlyTargetProgress;