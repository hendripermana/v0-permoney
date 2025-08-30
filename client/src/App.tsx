import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib';
import {
  Toaster,
  TooltipProvider,
  ThemeProvider,
  CustomCursor,
  ProtectedRoute,
} from '@/components';
import { AuthProvider } from '@/components/auth/auth-provider';
import { SidebarDemo } from '@/components/sidebar-demo';
import { DataImportTest } from '@/components/data-import-test';
import {
  Home,
  Dashboard,
  Login,
  Register,
  NotFound,
  DesignShowcase,
  IslamicFinance,
  Subscriptions,
} from '@/pages';
import ModernLogin from '@/pages/auth/modern-login';
import ModernRegister from '@/pages/auth/modern-register';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/design" component={DesignShowcase} />
      <Route path="/sidebar-test" component={SidebarDemo} />
      <Route path="/data-import-test" component={DataImportTest} />
      <Route path="/auth/login" component={ModernLogin} />
      <Route path="/auth/register" component={ModernRegister} />
      <Route path="/auth/legacy-login" component={Login} />
      <Route path="/auth/legacy-register" component={Register} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/islamic-finance">
        <ProtectedRoute>
          <IslamicFinance />
        </ProtectedRoute>
      </Route>
      <Route path="/subscriptions">
        <ProtectedRoute>
          <Subscriptions />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <CustomCursor />
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
