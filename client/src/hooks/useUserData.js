import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { DEMO_USER } from '../utils/demoData';

/**
 * Fetches and manages user analytics data.
 * Supports demo mode, loading states, and force-refresh.
 *
 * @param {string|null} username - GitHub username to fetch, or null for current user
 * @param {boolean} demoMode - If true, returns mock demo data
 */
const useUserData = (username, demoMode = false) => {
  const [data, setData]         = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchData = useCallback(async () => {
    if (demoMode) {
      setData(DEMO_USER);
      setLoading(false);
      return;
    }

    if (!username) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await client.get(`/user/${username}`);
      setData(res.data);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [username, demoMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = async () => {
    if (demoMode) return;
    try {
      await client.post('/user/refresh');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return { data, isLoading, error, lastFetched, refresh };
};

export default useUserData;
