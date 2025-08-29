import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // Here you would typically send the error to a monitoring service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // For now, we'll just log it
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    console.error('Error Report:', errorReport);
    
    // You could also send this to your backend
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(
      `Error Details:\n\n` +
      `Error ID: ${this.state.errorId}\n` +
      `Message: ${this.state.error?.message || 'Unknown error'}\n` +
      `URL: ${window.location.href}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `User Agent: ${navigator.userAgent}\n\n` +
      `Steps to reproduce:\n` +
      `1. \n` +
      `2. \n` +
      `3. \n\n` +
      `Additional information:\n`
    );
    
    window.open(`mailto:support@nakeslink.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      // If a custom fallback component is provided, use it
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
          />
        );
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
              }}
            >
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <ErrorOutline sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </motion.div>

              {/* Error Title */}
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: 'error.main',
                  mb: 2,
                }}
              >
                Oops! Terjadi Kesalahan
              </Typography>

              {/* Error Description */}
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
              >
                Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu
                dan sedang bekerja untuk memperbaikinya.
              </Typography>

              {/* Error ID */}
              {this.state.errorId && (
                <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
                  <AlertTitle>ID Kesalahan</AlertTitle>
                  <Typography variant="body2" component="code">
                    {this.state.errorId}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Silakan berikan ID ini saat menghubungi dukungan teknis.
                  </Typography>
                </Alert>
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #047857)',
                    },
                  }}
                >
                  Coba Lagi
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.50',
                    },
                  }}
                >
                  Kembali ke Beranda
                </Button>

                <Button
                  variant="text"
                  startIcon={<BugReport />}
                  onClick={this.handleReportBug}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Laporkan Bug
                </Button>
              </Box>

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 4, textAlign: 'left' }}>
                  <Alert severity="warning">
                    <AlertTitle>Detail Error (Development Mode)</AlertTitle>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        overflow: 'auto',
                        maxHeight: 200,
                        mt: 1,
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Alert>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Container>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, fallback) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    console.error('Error captured:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;