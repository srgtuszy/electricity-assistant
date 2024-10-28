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
      roomNumber: {
        type: SchemaType.INTEGER,
        description: "The room number the tip is for",
        nullable: false,
      },
    },
    required: ["tip", "roomNumber"],
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

exports.triggerGenerateTips = onCall({
  cors: true,
  timeoutSeconds: 1000
}, async (data, context) => {
  console.log("Generating tips");
  const tips = await generateTips();
  const tipsCollection = db.collection("tips");
  const tipsPromises = tips.map(tip => tipsCollection.add(tip));
  await Promise.all(tipsPromises);
  console.log(`Generated ${tips.length} tips`);
  
  return {data: tips};
});

async function generateTips() {
  console.log('Generating tips using Gemini...');  
  const table = await allRoomMeasurementsToTable();
  console.log(table);
  const prompt = `
  Given the following electricity and water measurements: ${table}. The unit for electricity samples is Watts and for water samples is Liters.
  Please provide several tips on how the user can increase sustainability. The tips should be concise and actionable. Each tip should refer to concrete
  measurements that the user can take to reduce their electricity consumption and should be expressed as a specific action user can partake to reduce their carbon footprint. 
  Avoid using non-actionable statements. Reference those measurements in the tips. Mention if the energy usage is too high or too low.
  The tips should be individual for every room number mentioned in the measurements.
  `;
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

async function roomMeasurementsToTable(roomId) {
  const roomRef = db.collection('rooms').doc(roomId);
  const measurementsSnapshot = await roomRef.collection('measurements').get();
  
  let table = '';
  
  measurementsSnapshot.forEach((doc) => {
    const measurement = doc.data();
    table += `date: ${measurement.date.toDate().toLocaleString('en-US', { timeZone: 'UTC' })}\n`;
    table += `type: "${measurement.type}"\n`;
    table += `value: ${measurement.value}\n\n`;
  });
  
  return table;
}

async function allRoomMeasurementsToTable() {
  const roomsSnapshot = await db.collection('rooms').get();
  
  let allTables = '';
  
  for (const roomDoc of roomsSnapshot.docs) {
    const roomId = roomDoc.id;
    const roomTable = await roomMeasurementsToTable(roomId);
    allTables += `Room Number: ${roomDoc.data().roomNumber}\n${roomTable}\n`;
  }
  
  return allTables;
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
