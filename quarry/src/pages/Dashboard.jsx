import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { dashboardFor, readTeam } from '@/lib/team';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl(dashboardFor(readTeam())), { replace: true });
  }, [navigate]);

  return null;
}
