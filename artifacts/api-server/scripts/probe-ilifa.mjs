const base = process.env.ILIFA_API_URL || `http://localhost:${process.env.PORT || 5000}`;

const questions = [
  "Why was East London Railway Station important?",
  "What did the station look like in the early 1900s?",
  "Who was the architect of the station clock tower in 1871?",
];

async function ask(question) {
  const response = await fetch(`${base}/api/ilifa/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      site: "east_london_railway_station",
      period: "early_1900s",
      question,
    }),
  });

  const body = await response.json();
  const serialized = JSON.stringify(body);
  if (serialized.includes("AIza") || serialized.includes("GEMINI_API_KEY")) {
    throw new Error("Response leaked a secret");
  }

  return { status: response.status, body };
}

for (const question of questions) {
  const result = await ask(question);
  console.log(JSON.stringify({ question, status: result.status, answer: result.body.answer, topics: result.body.sourceTopics }, null, 2));
}
