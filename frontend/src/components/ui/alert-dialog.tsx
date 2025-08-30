'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface AlertDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDialogActionProps {
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface AlertDialogCancelProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

const AlertDialog: React.FC<AlertDialogProps> = ({ 
  open: controlledOpen, 
  onOpenChange, 
  children 
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
            {children}
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({ asChild, children }) => {
  const { setOpen } = React.useContext(AlertDialogContext);

  const handleClick = () => {
    setOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ className, children }) => {
  const { open } = React.useContext(AlertDialogContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        'grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ className, children }) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>
    {children}
  </div>
);

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ className, children }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
    {children}
  </div>
);

const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ className, children }) => (
  <h2 className={cn('text-lg font-semibold', className)}>
    {children}
  </h2>
);

const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ className, children }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </p>
);

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ 
  className, 
  onClick, 
  disabled, 
  children 
}) => {
  const { setOpen } = React.useContext(AlertDialogContext);

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ className, onClick, children }) => {
  const { setOpen } = React.useContext(AlertDialogContext);

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'mt-2 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0',
        className
      )}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
