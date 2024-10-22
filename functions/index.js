const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const { onInit } = require('firebase-functions/v2/core');
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { functions } = require('firebase-functions');
const geminiKey = defineSecret('GEMINI_API_KEY');

admin.initializeApp();
const db = admin.firestore();

const schema = {
  description: "List of tips",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      tip: {
        type: SchemaType.STRING,
        description: "The tip value",
        nullable: false,
      },
    },
    required: ["tip"],
  },
};

let genAI, model;
onInit(() => {
  genAI = new GoogleGenerativeAI(geminiKey.value());
  model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
});

exports.triggerGenerateTips = onCall({cors: true}, async (data, context) => {
  console.log("Generating tips");
  const measurements = await fetchMeasurements();
  console.log(`Fetched ${measurements.length} measurements`);
  const tips = await generateTips(measurements);
  
  const tipsCollection = db.collection("tips");
  const tipsPromises = tips.map(tip => tipsCollection.add(tip));
  await Promise.all(tipsPromises);

  console.log(`Generated ${tips.length} tips`);
  return {data: tips};
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
  const table = await collectionToTable(db.collection("electricity"));
  console.log(table);
  const prompt = `
  Given the following electricity measurements: ${table}. The kwh means kilowatt hours and the date is the date of the measurement.
  Please provide several tips on how the user can increase sustainability. The tips should be concise and actionable. Each tip should refer to concrete
  measurements that the user can take to reduce their electricity consumption. Reference those measurements in the tips. Mention if the energy usage is too high or too low.`;
  try {
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();
    console.log('Gemini response:', generatedText);

    return JSON.parse(generatedText);
  } catch (error) {
    console.error('Error generating tips:', error);
    
    return [];
  }
}

async function collectionToTable(collectionRef) {
  const snapshot = await collectionRef.get();
  const documents = snapshot.docs.map(doc => doc.data());

  if (documents.length === 0) {
    return "No documents found in the collection.";
  }

  // Determine table headers from the first document
  const headers = Object.keys(documents[0]);

  // Build the table string
  let tableString = `| ${headers.join(' | ')} |\n`;
  tableString += `| ${headers.map(() => '---').join(' | ')} |\n`;

  documents.forEach(doc => {
    const row = headers.map(header => {
      const value = doc[header];
      if (value.toDate != null) {
        return value.toDate().toLocaleString();
      }
      return value;
    }).join(' | ');
    tableString += `| ${row} |\n`;
  });

  return tableString;
}
