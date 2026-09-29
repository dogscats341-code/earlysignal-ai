import {
  getGetEarlySignalWorkspaceQueryKey,
  useCreateEarlySignalMonitor,
  useGetEarlySignalWorkspace,
  useUpdateEarlySignalMonitorStatus,
} from '@workspace/api-client-react';
import {
  DEMO_AI_ANALYSES,
  DEMO_CHANGES,
  DEMO_MONITORS,
  type DemoAIAnalysis,
  type DemoChange,
  type DemoMonitor,
} from '@workspace/earlysignal-demo';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

export type Monitor = DemoMonitor;
export type Change = DemoChange;
export type AIAnalysis = DemoAIAnalysis;
export type MonitorType = Monitor['monitorType'];
export type MonitorStatus = Monitor['status'];
export type Severity = Change['severity'];
export type DataMode = 'database' | 'demo';

type DemoContextValue = {
  mode: DataMode;
  isLoading: boolean;
  monitors: Monitor[];
  changes: Change[];
  analyses: AIAnalysis[];
  addMonitor: (data: Pick<Monitor, 'name' | 'websiteUrl' | 'monitorType'>) => Promise<Monitor>;
  toggleMonitorStatus: (id: string) => Promise<Monitor>;
  getMonitor: (id?: string) => Monitor | undefined;
  getChange: (id?: string) => Change | undefined;
  getAnalysis: (changeId?: string) => AIAnalysis | undefined;
};

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const workspaceQuery = useGetEarlySignalWorkspace({
    query: {
      queryKey: getGetEarlySignalWorkspaceQueryKey(),
      retry: 1,
      staleTime: 0,
    },
  });
  const createMonitorMutation = useCreateEarlySignalMonitor();
  const updateStatusMutation = useUpdateEarlySignalMonitorStatus();
  const workspace = workspaceQuery.data;
  const monitors = workspace?.monitors ?? DEMO_MONITORS;
  const changes = workspace?.changes ?? DEMO_CHANGES;
  const analyses = workspace?.analyses ?? DEMO_AI_ANALYSES;
  const mode = workspace?.mode ?? 'demo';

  const value = useMemo<DemoContextValue>(() => {
    const refreshWorkspace = async () => {
      await queryClient.invalidateQueries({
        queryKey: getGetEarlySignalWorkspaceQueryKey(),
      });
    };

    return {
      mode,
      isLoading: workspaceQuery.isLoading,
      monitors,
      changes,
      analyses,
      addMonitor: async (data) => {
        const created = await createMonitorMutation.mutateAsync({
          data: {
            name: data.name,
            websiteUrl: data.websiteUrl,
            monitorType: 'Product Price',
          },
        });
        await refreshWorkspace();
        return created;
      },
      toggleMonitorStatus: async (id) => {
        const current = monitors.find((monitor) => monitor.id === id);
        if (!current) throw new Error('Monitor not found');
        const updated = await updateStatusMutation.mutateAsync({
          id,
          data: { status: current.status === 'active' ? 'paused' : 'active' },
        });
        await refreshWorkspace();
        return updated;
      },
      getMonitor: (id) => monitors.find((monitor) => monitor.id === id),
      getChange: (id) => changes.find((change) => change.id === id),
      getAnalysis: (changeId) => analyses.find((analysis) => analysis.changeId === changeId),
    };
  }, [
    analyses,
    changes,
    createMonitorMutation,
    mode,
    monitors,
    queryClient,
    updateStatusMutation,
    workspaceQuery.isLoading,
  ]);

  return createElement(DemoContext.Provider, { value }, children);
}

export function useDemoData() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemoData must be used within DemoDataProvider');
  return context;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function getTimeAgo(value: string) {
  const hours = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}