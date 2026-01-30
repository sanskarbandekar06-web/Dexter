
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const { subDays, format } = require("date-fns");
const { GoogleGenAI } = require("@google/genai");

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURATION ---
const GMAIL_USER = functions.config().email ? functions.config().email.user : process.env.GMAIL_USER;
const GMAIL_PASS = functions.config().email ? functions.config().email.pass : process.env.GMAIL_PASS;
const GENAI_KEY = functions.config().gemini ? functions.config().gemini.key : process.env.GENAI_KEY;

// Initialize GenAI
const ai = new GoogleGenAI({ apiKey: GENAI_KEY });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

/**
 * HELPER: Fetch 7-day metrics, generate Excel buffer, and AI summary.
 */
async function generateReportData(userId, userName) {
  const sevenDaysAgo = admin.firestore.Timestamp.fromDate(subDays(new Date(), 7));
  
  // 1. Fetch Metrics
  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("dailyStats")
    .where("date", ">=", sevenDaysAgo)
    .orderBy("date", "desc")
    .get();

  const rawData = [];
  let totalScore = 0;
  let totalDeepWork = 0;
  let totalProductivity = 0;
  let totalSleep = 0;

  snapshot.forEach((doc) => {
    const d = doc.data();
    rawData.push({
      Date: doc.id,
      "Daily Score": d.score || 0,
      "Deep Work (h)": d.activeFocusTime || 0,
      "Productivity (h)": d.study || 0,
      "Sleep (h)": d.sleep || 0,
      "Steps": d.steps || 0
    });

    totalScore += d.score || 0;
    totalDeepWork += d.activeFocusTime || 0;
    totalProductivity += d.study || 0;
    totalSleep += d.sleep || 0;
  });

  const count = rawData.length || 1;
  const summary = {
    "Average Score": (totalScore / count).toFixed(1),
    "Total Deep Work": totalDeepWork.toFixed(1) + " hrs",
    "Total Productivity": totalProductivity.toFixed(1) + " hrs",
    "Average Sleep": (totalSleep / count).toFixed(1) + " hrs",
    "Report Date": format(new Date(), "yyyy-MM-dd")
  };

  // 2. Generate Excel Buffer
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Summary
  const summaryWs = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Sheet 2: Daily Logs
  const logsWs = XLSX.utils.json_to_sheet(rawData);
  XLSX.utils.book_append_sheet(wb, logsWs, "Daily Logs");

  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // 3. Generate AI Insight
  let aiInsight = "Keep pushing forward.";
  try {
    if (rawData.length > 0) {
      const prompt = `
        You are a high-performance cognitive coach. Analyze these weekly stats for ${userName}:
        Avg Score: ${summary["Average Score"]}, Total Deep Work: ${summary["Total Deep Work"]}, Avg Sleep: ${summary["Average Sleep"]}.
        Provide a 2-sentence encouraging summary about their cognitive rhythm. Be concise and solar-punk themed.
      `;
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      aiInsight = result.response.text();
    }
  } catch (e) {
    console.error("AI Insight failed", e);
  }

  return { excelBuffer, summary, aiInsight, hasData: rawData.length > 0 };
}

/**
 * HELPER: Send Email
 */
async function sendEmail(email, userName, reportData) {
  const { excelBuffer, summary, aiInsight } = reportData;
  
  const htmlContent = `
    <div style="font-family: sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #f97316;">Weekly Cognitive Report</h2>
      <p>Greetings <strong>${userName}</strong>,</p>
      <p>${aiInsight}</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>🧠 Avg Score:</strong> ${summary["Average Score"]}</p>
        <p style="margin: 5px 0;"><strong>⚡ Deep Work:</strong> ${summary["Total Deep Work"]}</p>
        <p style="margin: 5px 0;"><strong>💤 Avg Sleep:</strong> ${summary["Average Sleep"]}</p>
      </div>

      <p style="font-size: 12px; color: #666;">Attached is your detailed Excel log.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Dexter AI" <${GMAIL_USER}>`,
    to: email,
    subject: `Weekly Report: ${summary["Average Score"]} Score`,
    html: htmlContent,
    attachments: [
      {
        filename: `Dexter_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
        content: excelBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}

/**
 * FUNCTION 1: Manual Trigger (HTTPS Callable)
 */
exports.sendWeeklyReportNow = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const userId = context.auth.uid;
  
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User profile not found");
    
    const userData = userDoc.data();
    const email = userData.email;
    const name = userData.name || "Operative";

    const reportData = await generateReportData(userId, name);
    
    if (!reportData.hasData) {
      return { success: false, message: "No data found for the last 7 days." };
    }

    await sendEmail(email, name, reportData);
    return { success: true, message: "Report sent successfully." };

  } catch (error) {
    console.error("Manual Report Error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * FUNCTION 2: Scheduled Trigger (Cron)
 */
exports.weeklyReportScheduler = functions.pubsub
  .schedule("0 9 * * 1") // Every Monday at 9:00 AM
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    console.log("Starting Scheduled Weekly Reports...");
    
    if (!GMAIL_USER || !GMAIL_PASS) {
      console.error("Email credentials missing.");
      return null;
    }

    const usersSnapshot = await db.collection("users").get();
    const promises = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.email) {
        promises.push(
          generateReportData(doc.id, userData.name || "Operative")
            .then((reportData) => {
              if (reportData.hasData) {
                return sendEmail(userData.email, userData.name, reportData);
              }
            })
            .catch((err) => console.error(`Failed for ${doc.id}`, err))
        );
      }
    });

    await Promise.all(promises);
    console.log(`Processed ${promises.length} users.`);
    return null;
  });
