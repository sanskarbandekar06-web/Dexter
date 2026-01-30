
// Google Fit API Integration

const CLIENT_ID = "652140491951-pvlka40ihq5894berolt9q9ir2imssk7.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "https://www.googleapis.com/auth/fitness.body.read"
].join(" ");

const REDIRECT_URI = "https://dexter-trial-4.vercel.app/googlefit/callback";

export interface GoogleFitData {
  steps: number;
  calories: number;
  avgHr: number;
  sleepHours: number;
}

export const requestGoogleFitAuth = () => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
  window.location.href = url;
};

export const fetchGoogleFitData = async (accessToken: string): Promise<GoogleFitData> => {
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMillis = startOfDay.getTime();
  const twoHoursAgoMillis = now - (2 * 60 * 60 * 1000);

  // 1. Fetch Aggregate Data for Steps and Calories (Today)
  const aggregateBody = {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.sleep.segment" }
    ],
    bucketByTime: { durationMillis: 86400000 }, // 1 day bucket
    startTimeMillis: startOfDayMillis,
    endTimeMillis: now
  };

  // 2. Fetch Heart Rate Data (Past 2 Hours)
  const hrBody = {
    aggregateBy: [
      { dataTypeName: "com.google.heart_rate.bpm" }
    ],
    bucketByTime: { durationMillis: 7200000 }, // 2 hours
    startTimeMillis: twoHoursAgoMillis,
    endTimeMillis: now
  };

  try {
    const [dailyRes, hrRes] = await Promise.all([
      fetch("https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(aggregateBody)
      }),
      fetch("https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(hrBody)
      })
    ]);

    const dailyData = await dailyRes.json();
    const hrData = await hrRes.json();

    let steps = 0;
    let calories = 0;
    let sleepHours = 0;
    let avgHr = 0;

    // Parse Daily Data (Steps, Calories, Sleep)
    if (dailyData.bucket && dailyData.bucket.length > 0) {
      const bucket = dailyData.bucket[0]; 
      
      bucket.dataset.forEach((ds: any) => {
        if (ds.dataSourceId.includes("step_count")) {
           steps = ds.point.reduce((acc: number, p: any) => acc + (p.value[0]?.intVal || 0), 0);
        }
        if (ds.dataSourceId.includes("calories")) {
           calories = ds.point.reduce((acc: number, p: any) => acc + (p.value[0]?.fpVal || 0), 0);
        }
        if (ds.dataSourceId.includes("sleep")) {
           ds.point.forEach((p: any) => {
              const start = parseInt(p.startTimeNanos) / 1000000;
              const end = parseInt(p.endTimeNanos) / 1000000;
              const type = p.value[0]?.intVal; 
              if (type && type !== 1 && type !== 3) {
                  sleepHours += (end - start) / (1000 * 60 * 60);
              }
           });
        }
      });
    }

    // Parse Heart Rate
    if (hrData.bucket && hrData.bucket.length > 0) {
      const hrBucket = hrData.bucket[0];
      const hrDs = hrBucket.dataset.find((ds: any) => ds.dataSourceId.includes("heart_rate"));
      if (hrDs && hrDs.point.length > 0) {
        const point = hrDs.point[0];
        if (point && point.value) {
            avgHr = point.value[0]?.fpVal || 0;
        }
      }
    }

    return {
      steps: Math.round(steps),
      calories: Math.round(calories),
      avgHr: Math.round(avgHr),
      sleepHours: parseFloat(sleepHours.toFixed(1))
    };

  } catch (e) {
    console.error("Error fetching Google Fit data", e);
    throw e;
  }
};
