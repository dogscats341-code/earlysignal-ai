import { Route, Switch } from 'wouter';
import {
  AlertsPage,
  ChangeDetailPage,
  DashboardPage,
  LandingPage,
  MonitorDetailPage,
  MonitorsPage,
  NewMonitorPage,
  NotFoundPage,
} from '@/pages/earlysignal-pages';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/monitors" component={MonitorsPage} />
      <Route path="/monitors/new" component={NewMonitorPage} />
      <Route path="/monitors/:id" component={MonitorDetailPage} />
      <Route path="/changes/:id" component={ChangeDetailPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
