import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { startActivityTracking } from './activity.js';

export function ActivityTracker() {
  const { user, accessToken, isLoading } = useAuth();
  useEffect(() => {
    if (!accessToken || isLoading || user?.role !== 'USER') return;
    return startActivityTracking(accessToken);
  }, [accessToken, isLoading, user?.id, user?.role]);
  return null;
}
