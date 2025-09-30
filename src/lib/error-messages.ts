// Human-readable error messages for common error scenarios
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers. Please check your internet connection and try again.',
    action: 'Retry',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timed Out',
    message: 'The request is taking longer than expected. This might be due to a slow connection.',
    action: 'Try Again',
  },
  OFFLINE_ERROR: {
    title: 'You\'re Offline',
    message: 'Your changes have been saved locally and will sync when you\'re back online.',
    action: 'OK',
  },

  // Authentication errors
  UNAUTHORIZED: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons. Please sign in again to continue.',
    action: 'Sign In',
  },
  FORBIDDEN: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action. Contact your household admin if you need access.',
    action: 'Contact Admin',
  },
  INVALID_CREDENTIALS: {
    title: 'Sign In Failed',
    message: 'The email or password you entered is incorrect. Please check and try again.',
    action: 'Try Again',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    message: 'Please check the information you entered and make sure all required fields are filled correctly.',
    action: 'Fix Errors',
  },
  REQUIRED_FIELD: {
    title: 'Missing Information',
    message: 'Please fill in all required fields before continuing.',
    action: 'Complete Form',
  },
  INVALID_EMAIL: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    action: 'Fix Email',
  },
  INVALID_AMOUNT: {
    title: 'Invalid Amount',
    message: 'Please enter a valid amount. Make sure it\'s a positive number.',
    action: 'Fix Amount',
  },

  // Transaction errors
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Funds',
    message: 'The account doesn\'t have enough balance for this transaction.',
    action: 'Choose Different Account',
  },
  DUPLICATE_TRANSACTION: {
    title: 'Duplicate Transaction',
    message: 'A similar transaction was already recorded recently. Are you sure you want to add this?',
    action: 'Add Anyway',
  },
  INVALID_DATE: {
    title: 'Invalid Date',
    message: 'Please select a valid date. Future dates are not allowed for transactions.',
    action: 'Fix Date',
  },

  // Account errors
  ACCOUNT_NOT_FOUND: {
    title: 'Account Not Found',
    message: 'The account you\'re trying to access doesn\'t exist or has been deleted.',
    action: 'Choose Different Account',
  },
  ACCOUNT_INACTIVE: {
    title: 'Account Inactive',
    message: 'This account has been deactivated and cannot be used for transactions.',
    action: 'Activate Account',
  },

  // Budget errors
  BUDGET_EXCEEDED: {
    title: 'Budget Exceeded',
    message: 'This transaction would exceed your budget for this category. Do you want to continue?',
    action: 'Continue Anyway',
  },
  BUDGET_NOT_FOUND: {
    title: 'Budget Not Found',
    message: 'The budget you\'re trying to access doesn\'t exist.',
    action: 'Create Budget',
  },

  // File upload errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The file you\'re trying to upload is too large. Please choose a file smaller than 10MB.',
    action: 'Choose Smaller File',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'Please upload a valid image file (JPG, PNG, or PDF).',
    action: 'Choose Different File',
  },
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'Failed to upload the file. Please check your connection and try again.',
    action: 'Try Again',
  },

  // Sync errors
  SYNC_FAILED: {
    title: 'Sync Failed',
    message: 'Some of your changes couldn\'t be synced. They\'re saved locally and will retry automatically.',
    action: 'Retry Now',
  },
  SYNC_CONFLICT: {
    title: 'Sync Conflict',
    message: 'This item was modified by someone else. Please review the changes and choose which version to keep.',
    action: 'Resolve Conflict',
  },

  // Server errors
  SERVER_ERROR: {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error. Our team has been notified and is working on a fix.',
    action: 'Try Again Later',
  },
  MAINTENANCE: {
    title: 'Under Maintenance',
    message: 'We\'re performing scheduled maintenance. Please try again in a few minutes.',
    action: 'Try Later',
  },
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'You\'re making requests too quickly. Please wait a moment before trying again.',
    action: 'Wait and Retry',
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'Something unexpected happened. Please try again or contact support if the problem persists.',
    action: 'Try Again',
  },
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

// Error classification based on HTTP status codes and error types
export function classifyError(error: any): ErrorCode {
  // Network errors
  if (!navigator.onLine) {
    return 'OFFLINE_ERROR';
  }

  if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
    return 'TIMEOUT_ERROR';
  }

  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  // HTTP status codes
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status;
    
    switch (status) {
      case 400:
        if (error.message?.includes('validation')) {
          return 'VALIDATION_ERROR';
        }
        if (error.message?.includes('insufficient funds')) {
          return 'INSUFFICIENT_FUNDS';
        }
        if (error.message?.includes('duplicate')) {
          return 'DUPLICATE_TRANSACTION';
        }
        return 'VALIDATION_ERROR';
      
      case 401:
        if (error.message?.includes('credentials')) {
          return 'INVALID_CREDENTIALS';
        }
        return 'UNAUTHORIZED';
      
      case 403:
        return 'FORBIDDEN';
      
      case 404:
        if (error.message?.includes('account')) {
          return 'ACCOUNT_NOT_FOUND';
        }
        if (error.message?.includes('budget')) {
          return 'BUDGET_NOT_FOUND';
        }
        return 'UNKNOWN_ERROR';
      
      case 409:
        return 'SYNC_CONFLICT';
      
      case 413:
        return 'FILE_TOO_LARGE';
      
      case 415:
        return 'INVALID_FILE_TYPE';
      
      case 429:
        return 'RATE_LIMITED';
      
      case 500:
      case 502:
      case 503:
        if (error.message?.includes('maintenance')) {
          return 'MAINTENANCE';
        }
        return 'SERVER_ERROR';
      
      case 504:
        return 'TIMEOUT_ERROR';
    }
  }

  // Specific error messages
  if (error.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('email') && message.includes('invalid')) {
      return 'INVALID_EMAIL';
    }
    
    if (message.includes('amount') && message.includes('invalid')) {
      return 'INVALID_AMOUNT';
    }
    
    if (message.includes('required') || message.includes('missing')) {
      return 'REQUIRED_FIELD';
    }
    
    if (message.includes('budget') && message.includes('exceeded')) {
      return 'BUDGET_EXCEEDED';
    }
    
    if (message.includes('sync') && message.includes('failed')) {
      return 'SYNC_FAILED';
    }
    
    if (message.includes('upload') && message.includes('failed')) {
      return 'UPLOAD_FAILED';
    }
  }

  return 'UNKNOWN_ERROR';
}

// Get user-friendly error message
export function getErrorMessage(error: any) {
  const errorCode = classifyError(error);
  return ERROR_MESSAGES[errorCode];
}

// Indonesian translations for error messages
export const ERROR_MESSAGES_ID = {
  NETWORK_ERROR: {
    title: 'Masalah Koneksi',
    message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.',
    action: 'Coba Lagi',
  },
  TIMEOUT_ERROR: {
    title: 'Permintaan Timeout',
    message: 'Permintaan membutuhkan waktu lebih lama dari yang diharapkan. Mungkin karena koneksi yang lambat.',
    action: 'Coba Lagi',
  },
  OFFLINE_ERROR: {
    title: 'Anda Sedang Offline',
    message: 'Perubahan Anda telah disimpan secara lokal dan akan disinkronkan saat Anda online kembali.',
    action: 'OK',
  },
  UNAUTHORIZED: {
    title: 'Sesi Berakhir',
    message: 'Sesi Anda telah berakhir untuk alasan keamanan. Silakan masuk kembali untuk melanjutkan.',
    action: 'Masuk',
  },
  INSUFFICIENT_FUNDS: {
    title: 'Saldo Tidak Mencukupi',
    message: 'Akun tidak memiliki saldo yang cukup untuk transaksi ini.',
    action: 'Pilih Akun Lain',
  },
  // Add more Indonesian translations as needed...
} as const;

// Get localized error message
export function getLocalizedErrorMessage(error: any, locale: 'en' | 'id' = 'en') {
  const errorCode = classifyError(error);
  
  if (locale === 'id' && ERROR_MESSAGES_ID[errorCode as keyof typeof ERROR_MESSAGES_ID]) {
    return ERROR_MESSAGES_ID[errorCode as keyof typeof ERROR_MESSAGES_ID];
  }
  
  return ERROR_MESSAGES[errorCode];
}
