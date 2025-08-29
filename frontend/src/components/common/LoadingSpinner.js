import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
} from '@mui/material';
import { motion } from 'framer-motion';
import { LocalHospital } from '@mui/icons-material';

const LoadingSpinner = ({ 
  size = 40, 
  message = 'Memuat...', 
  fullScreen = false,
  overlay = false,
  color = 'primary'
}) => {
  const LoadingContent = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
        }}
      >
        {/* Custom Logo Spinner */}
        <Box sx={{ position: 'relative' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <CircularProgress
              size={size}
              thickness={4}
              color={color}
              sx={{
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
          </motion.div>
          
          {/* Logo in center */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size * 0.5,
              height: size * 0.5,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <LocalHospital sx={{ fontSize: size * 0.3 }} />
          </Box>
        </Box>

        {/* Loading Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {message}
            </Typography>
          </motion.div>
        )}

        {/* Animated dots */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );

  // Full screen loading
  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 9999,
        }}
      >
        <LoadingContent />
      </Box>
    );
  }

  // Overlay loading
  if (overlay) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <LoadingContent />
      </Backdrop>
    );
  }

  // Inline loading
  return (
    <Box
      sx={
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          width: '100%',
        }
      }
    >
      <LoadingContent />
    </Box>
  );
};

// Skeleton loading component for lists
export const SkeletonLoader = ({ 
  rows = 3, 
  height = 60, 
  showAvatar = false,
  showActions = false 
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              mb: 1,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {showAvatar && (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'grey.200',
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
            
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  height: 16,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  mb: 1,
                  width: '70%',
                  animation: 'pulse 2s infinite',
                }}
              />
              <Box
                sx={{
                  height: 12,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  width: '50%',
                  animation: 'pulse 2s infinite',
                }}
              />
            </Box>
            
            {showActions && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    animation: 'pulse 2s infinite',
                  }}
                />
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    animation: 'pulse 2s infinite',
                  }}
                />
              </Box>
            )}
          </Box>
        </motion.div>
      ))}
    </Box>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Box
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                height: 120,
                bgcolor: 'grey.200',
                borderRadius: 1,
                mb: 2,
                animation: 'pulse 2s infinite',
              }}
            />
            <Box
              sx={{
                height: 20,
                bgcolor: 'grey.200',
                borderRadius: 1,
                mb: 1,
                width: '80%',
                animation: 'pulse 2s infinite',
              }}
            />
            <Box
              sx={{
                height: 16,
                bgcolor: 'grey.200',
                borderRadius: 1,
                mb: 2,
                width: '60%',
                animation: 'pulse 2s infinite',
              }}
            />
            <Box
              sx={{
                height: 36,
                bgcolor: 'grey.200',
                borderRadius: 1,
                animation: 'pulse 2s infinite',
              }}
            />
          </Box>
        </motion.div>
      ))}
    </Box>
  );
};

export default LoadingSpinner;