import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import { motion } from 'framer-motion';

const NavigationItem = ({ item, isActive, onClick }) => {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <motion.div
        style={{ width: '100%' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <ListItemButton
          onClick={onClick}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isActive
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))'
                : 'transparent',
              transition: 'all 0.3s ease',
            },
            '&:hover': {
              bgcolor: 'transparent',
              '&::before': {
                background: isActive
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            },
            ...(isActive && {
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 4,
                height: '60%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderRadius: '0 2px 2px 0',
              },
            }),
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: isActive ? 'primary.main' : 'text.secondary',
              transition: 'color 0.3s ease',
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
              }}
            >
              {item.icon}
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={item.text}
            sx={{
              zIndex: 1,
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'primary.main' : 'text.primary',
                transition: 'all 0.3s ease',
              },
            }}
          />
          {item.badge && (
            <Box
              sx={{
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: 'error.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                zIndex: 1,
              }}
            >
              {item.badge}
            </Box>
          )}
        </ListItemButton>
      </motion.div>
    </ListItem>
  );
};

export default NavigationItem;