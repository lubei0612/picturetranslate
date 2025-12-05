export interface HistoryItem {
  id: string;
  date: string;
  projectName: string;
  action: string;
  result: 'success' | 'failed';
  resultMessage?: string;
  projectId?: string;
  isDemo?: boolean;
}

export interface HistoryListProps {
  items: HistoryItem[];
  loading?: boolean;
  onItemClick?: (item: HistoryItem) => void;
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'success' | 'failed';
}
