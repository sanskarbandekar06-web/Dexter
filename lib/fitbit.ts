
const PROJECT_ID = "day-score-f3947"; 
const REGION = "us-central1";
const CLOUD_FUNCTION_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

export const getFitbitAuthUrl = (uid: string) => {
  const appRedirect = window.location.origin; 
  return `${CLOUD_FUNCTION_BASE}/fitbitAuth?uid=${uid}&redirect=${encodeURIComponent(appRedirect)}`;
};

export const fetchFitbitData = async (accessToken: string, userId: string = '-') => {
  // Call our Cloud Function proxy instead of Fitbit directly
  // This satisfies the "Server-side API calls" requirement
  const response = await fetch(`${CLOUD_FUNCTION_BASE}/getFitbitData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accessToken, userId })
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Token Expired");
    throw new Error("Failed to fetch Fitbit data");
  }

  return await response.json();
};

export const calculateLast2HoursHR = (hrDataset: any[]) => {
  if (!hrDataset || hrDataset.length === 0) return 0;
  
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  const parseTime = (timeStr: string) => {
    const d = new Date();
    const [h, m, s] = timeStr.split(':').map(Number);
    d.setHours(h, m, s, 0);
    return d;
  };

  const recentReadings = hrDataset.filter((point: any) => {
    const pointTime = parseTime(point.time);
    return pointTime >= twoHoursAgo && pointTime <= now;
  });

  if (recentReadings.length === 0) return 0;

  const sum = recentReadings.reduce((acc: number, curr: any) => acc + curr.value, 0);
  return Math.round(sum / recentReadings.length);
};
