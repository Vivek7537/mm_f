import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const SummaryCard = ({
    title,
    value,
    icon: Icon,
    iconColor = '#1976d2',
    iconBg = 'rgba(25, 118, 210, 0.1)',
    subtitle,
    onClick,
}) => {
    return (
        <Card
            onClick={onClick}
            sx={{
                height: '100%',
                borderRadius: 4,
                cursor: onClick ? 'pointer' : 'default',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.07)',
                transition: 'transform 0.2s',
                '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
            }}
        >
            <CardContent
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 3,
                }}
            >
                {/* Icon */}
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        minWidth: 48,
                        borderRadius: '50%',
                        backgroundColor: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                    }}
                >
                    <Icon sx={{ fontSize: 28, color: iconColor }} />
                </Box>

                {/* Text */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        fontWeight={600}
                    >
                        {title}
                    </Typography>

                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
                    >
                        {value}
                    </Typography>

                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
