
import { UserData } from "../types";

/**
 * AI COGNITIVE ENGINE
 * Simulates wearable data and computes cognitive performance.
 */

// 1. Predictive Health Model (Simulation)
// Uses time of day to generate realistic cumulative data for the Hackathon demo.
export const simulateHealthMetrics = (currentHour: number): Partial<UserData> => {
  // Circadian Curve for Steps (Low at night, peaks morning/evening)
  let projectedSteps = 0;
  if (currentHour < 6) projectedSteps = 0;
  else if (currentHour < 12) projectedSteps = 500 + (currentHour - 6) * 800; // Morning ramp
  else if (currentHour < 18) projectedSteps = 5300 + (currentHour - 12) * 500; // Afternoon plateau
  else projectedSteps = 8300 + (currentHour - 18) * 200; // Evening wind down
  
  // Add some "noise" so it looks live
  const noise = Math.floor(Math.random() * 50);
  const steps = Math.min(15000, projectedSteps + noise);

  // Calorie Burn based on BMR (~1500) + Active Burn
  const calories = Math.floor(1200 + (steps * 0.04) + (currentHour * 20));

  // Heart Rate varies by simulated activity "context"
  // If it's work hours (9-5), HR is lower (sedentary). Evening is higher (exercise).
  let baseHr = 65;
  if (currentHour >= 17 && currentHour <= 19) baseHr = 110; // Simulated gym time
  else if (currentHour >= 9 && currentHour <= 17) baseHr = 72; // Work stress
  
  const heartRate = baseHr + Math.floor(Math.random() * 10 - 5);

  // Sleep is static for the day, usually updated once. 
  // We'll simulate a random "good" or "bad" night based on the date to keep it consistent for the session.
  const daySeed = new Date().getDate();
  const sleep = 6 + (daySeed % 3) + (Math.random() * 0.5); // Between 6 and 9 hours

  return {
    steps: Math.floor(steps),
    calories: Math.floor(calories),
    heartRate: Math.floor(heartRate),
    sleep: parseFloat(sleep.toFixed(2)),
    // Scale exercise to 0-10 based on steps (10k steps = 10.0)
    exercise: parseFloat((steps / 1000).toFixed(2)) 
  };
};

// 2. Cognitive Performance Scorer
// Combines physical data with digital habits
export const calculateCognitiveScore = (data: UserData): number => {
  // Weights
  const W_SLEEP = 30;
  const W_STUDY = 30;
  const W_VITALITY = 20;
  const W_DIGITAL = -20; // Penalty

  // Normalization
  const normSleep = Math.min(data.sleep / 8, 1.2); // Cap at 1.2x (9.6h)
  const normStudy = Math.min(data.study / 4, 1.5); // Cap at 1.5x (6h)
  const normVitality = Math.min((data.steps || 0) / 10000, 1.2);
  
  // Screen Time Penalty: < 4h is good (0 penalty), > 8h is max penalty
  const screenPenalty = Math.max(0, Math.min((data.screenTime - 2) / 6, 1)); 

  let score = (normSleep * W_SLEEP) + (normStudy * W_STUDY) + (normVitality * W_VITALITY) - (screenPenalty * Math.abs(W_DIGITAL));
  
  // Boost for "Deep Focus" ratio
  const focusRatio = data.activeFocusTime && data.screenTime > 0 ? (data.activeFocusTime / data.screenTime) : 0;
  if (focusRatio > 0.5) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
};

// 3. Burnout Prediction Model
export const assessBurnoutRisk = (data: UserData): 'Low' | 'Moderate' | 'High' => {
  let riskPoints = 0;

  if (data.sleep < 6) riskPoints += 3;
  else if (data.sleep < 7) riskPoints += 1;

  if (data.screenTime > 8) riskPoints += 3;
  else if (data.screenTime > 6) riskPoints += 1;

  // Sedentary penalty
  if ((data.steps || 0) < 3000) riskPoints += 2;

  // Idle vs Focus: High idle time on screen suggests "doomscrolling" or distraction
  if ((data.idleTime || 0) > 3) riskPoints += 1;

  if (riskPoints >= 5) return 'High';
  if (riskPoints >= 3) return 'Moderate';
  return 'Low';
};
