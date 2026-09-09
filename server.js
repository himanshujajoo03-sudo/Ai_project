require('dotenv').config();
const express = require('express');
const cors = require('cors');

const createIncidentRouter = require('./routes/incident');

const { initSupabase } = require('./services/supabaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory store for processed incidents (id, raw report, severity,
// assigned resources, dispatch status, timestamps, evidence, ...).
const processedIncidents = [];

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const isGroqConfigured = Boolean(
    groqKey && groqKey !== 'your_groq_api_key' && groqKey.trim() !== ''
  );

  res.json({
    status: 'ok',
    message: 'Freebuff disaster response backend is running',
    llmProvider: process.env.LLM_PROVIDER || 'groq',
    groqConfigured: isGroqConfigured,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.use('/api', createIncidentRouter(processedIncidents));

app.listen(PORT, async () => {
  console.log(`Freebuff backend listening on http://localhost:${PORT}`);
  console.log(`Active LLM Provider: ${process.env.LLM_PROVIDER || 'groq'}`);
  console.log(`Groq Model: ${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}`);
  await initSupabase();
});