const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");
admin.initializeApp();

const db = admin.firestore();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.triggerGenerateTips = onCall({cors: true}, async (req, res) => {
  console.log("Generating tips");
  console.log(await db.collection("electricity").get());
  const measurements = await fetchMeasurements();
  console.log(`Fetched ${measurements.length} measurements`);
  const tips = await generateTips(measurements);
  tips.forEach(async (tip) => {
    await db.collection("tips").add(tip);
  });
  console.log(`Generated ${tips.length} tips`);
  res.send({data: tips});
});

async function fetchMeasurements() {
  return await db.collection("electricity")
    .orderBy("date", "desc")
    .get()
    .then((snapshot) => snapshot.docs.map((doc) => {
      const data = doc.data();
      data.date = data.date.toDate().toLocaleString();
      return data;
    }));
}

async function generateTips(measurements) {
  console.log('Generating tips using Gemini...');
  
  // Prepare the prompt by appending the measurements
  const prompt = `
Given the following electricity measurements:
${JSON.stringify(measurements, null, 2)}

Please provide 3 tips on how the user can increase sustainability. The tips should be concise and actionable. Provide the response in JSON format like:
[
  {"tip": "First tip"},
  {"tip": "Second tip"},
  {"tip": "Third tip"}
]
`;
  try {
    const result = await model.generateContent(prompt);
    const generatedText = removeMarkdown(result.response.text());
    console.log('Gemini response:', generatedText);
    const tips = JSON.parse(generatedText);
    return tips;
  } catch (error) {
    console.error('Error generating tips:', error);
    return [];
  }
}

function removeMarkdown(text) {
  // Remove horizontal rules
  text = text.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, '');

  // Remove headings
  text = text.replace(/^(#{1,6})\s+(.+)$/gm, '$2');

  // Remove bold and italic formatting
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');

  // Remove strikethrough formatting
  text = text.replace(/~~(.+?)~~/g, '$1');

  // Remove blockquotes
  text = text.replace(/^\s*>\s*(.+)$/gm, '$1');

  // Remove inline code
  text = text.replace(/`(.+?)`/g, '$1');

  // Remove code blocks
  text = text.replace(/```(.+?)```/gs, '$1');

  // Remove links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '$1');

  // Remove images
  text = text.replace(/!\[(.+?)\]\((.+?)\)/g, '');

  // Remove unordered list bullets
  text = text.replace(/^\s*[-*+]\s+/gm, '');

  // Remove ordered list numbers
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // Remove GitHub-style code blocks with language identifiers
  text = text.replace(/[a-z]*\n([\s\S]*?)/g, '$1');

  // Remove backticks
  text = text.replace(/`/g, '');

  // Trim leading and trailing whitespace
  text = text.trim();
  
  return text;
}
