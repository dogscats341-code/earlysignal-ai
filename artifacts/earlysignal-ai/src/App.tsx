import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DemoDataProvider } from '@/lib/demo-data';
import {
  ChangeDetailPage,
  DashboardPage,
  LandingPage,
  MonitorDetailPage,
  MonitorsPage,
  NewMonitorPage,
  AlertsPage,
  NotFoundPage,
  SettingsPage,
} from '@/pages/earlysignal-pages';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/monitors/new" component={NewMonitorPage} />
        <Route path="/monitors/:id" component={MonitorDetailPage} />
        <Route path="/monitors" component={MonitorsPage} />
        <Route path="/changes/:id" component={ChangeDetailPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DemoDataProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </DemoDataProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
