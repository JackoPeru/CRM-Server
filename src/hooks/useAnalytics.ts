import { useSelector } from 'react-redux';
import {
  selectAnalytics, setAnalyticsFilters,
} from '../store/slices/analyticsSlice';

// Assuming RootState is defined in your store configuration
import { RootState, useAppDispatch } from '../store';

export const useAnalytics = () => {
  const dispatch = useAppDispatch();
  const analyticsState = useSelector((state: RootState) => selectAnalytics(state));

  const { 
    dailySummary, 
    weeklySummary, 
    monthlySummary, 
    performanceMetrics, 
    trendData, 
    loading, 
    error, 
    filters 
  } = analyticsState;

  const setView = (newView: 'daily' | 'weekly' | 'monthly') => {
    dispatch(setAnalyticsFilters({ period: newView }));
  };

  const setDateRange = (newDateRange: { start: string; end: string }) => {
    dispatch(setAnalyticsFilters({ 
      dateFrom: newDateRange.start, 
      dateTo: newDateRange.end 
    }));
  };

  const setFilter = (newFilter: { clientId?: string; category?: string }) => {
    dispatch(setAnalyticsFilters(newFilter));
  };

  return {
    // State
    dailySummary,
    weeklySummary,
    monthlySummary,
    performanceMetrics,
    trendData,
    loading,
    error,
    filters,

    // Actions
    setView,
    setDateRange,
    setFilter,
  };
};

export default useAnalytics;