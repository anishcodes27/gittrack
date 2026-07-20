import { useState, useEffect } from 'react';
import client from '../api/client';
import { DEMO_LEADERBOARD } from '../utils/demoData';

const useLeaderboard = (slug = null, demoMode = false) => {
  const [data, setData]         = useState(null);
  const [boards, setBoards]     = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (demoMode) {
        setBoards([{ institutionName: 'IIT Kharagpur', institutionSlug: 'iit-kgp', memberCount: 48, avgImpactScore: 71 }]);
        setData({ institutionName: 'IIT Kharagpur', members: DEMO_LEADERBOARD });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (slug) {
          const res = await client.get(`/leaderboard/${slug}`);
          setData(res.data);
        } else {
          const res = await client.get('/leaderboard');
          setBoards(res.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [slug, demoMode]);

  return { data, boards, isLoading, error };
};

export default useLeaderboard;
