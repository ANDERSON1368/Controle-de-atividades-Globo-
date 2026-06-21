/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_EMPLOYEES, INITIAL_TASKS } from "./src/data";

dotenv.config();

// In-memory server database to allow shared multi-user updates on the same server instance
let serverEmployees = [...INITIAL_EMPLOYEES];
let serverTasks = [...INITIAL_TASKS];

interface Bottleneck {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface UnnecessaryTime {
  activity: string;
  wasteType: string;
  estimatedWastedMins: number;
  explanation: string;
}

interface Recommendation {
  methodology: string;
  action: string;
  expectedImpact: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body volume limits high to accommodate base64 photos/evidence
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize Gemini Client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: geminiApiKey || "placeholder"
  });

  // Fetch current synchronized database
  app.get("/api/database", (req, res) => {
    res.json({
      status: "ok",
      employees: serverEmployees,
      tasks: serverTasks
    });
  });

  // Update synchronized database
  app.post("/api/database/update", (req, res) => {
    try {
      const { employees, tasks } = req.body;
      if (employees && Array.isArray(employees)) {
        serverEmployees = employees;
      }
      if (tasks && Array.isArray(tasks)) {
        serverTasks = tasks;
      }
      res.json({
        status: "ok",
        message: "Dados sincronizados com o servidor com sucesso."
      });
    } catch (err: any) {
      console.error("Error updating database memory: ", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Reset database back to default seed spreadsheets
  app.post("/api/database/reset", (req, res) => {
    try {
      serverEmployees = [...INITIAL_EMPLOYEES];
      serverTasks = [...INITIAL_TASKS];
      res.json({
        status: "ok",
        message: "Banco de dados do servidor resetado para os valores padrões."
      });
    } catch (err: any) {
      console.error("Error resetting database memory: ", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API router: analyze productivity and activities with professional methodologies
  app.post("/api/analyze-productivity", async (req, res) => {
    try {
      const { tasks, employeeName, methodology = "lean" } = req.body;

      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: "Dados de tarefas ausentes ou inválidos." });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback Heuristics Lean Analyzer (Demo Mode)
        const parsedTasks = tasks.map((t: any) => {
          const activityLower = (t.activity || "").toLowerCase();
          const notesLower = (t.notes || "").toLowerCase();
          const combined = `${activityLower} ${notesLower}`;
          
          let durationHours = parseFloat(t.totalHours) || 0.5;
          if (isNaN(durationHours) || durationHours <= 0) {
            durationHours = 0.5;
          }
          
          // Classify as productive (VA) or wasteful (NVA)
          const isNVA = combined.includes("espera") || 
                        combined.includes("aguardando") || 
                        combined.includes("atraso") || 
                        combined.includes("parada") || 
                        combined.includes("quebrado") || 
                        combined.includes("ocioso") || 
                        combined.includes("almoço") || 
                        combined.includes("intervalo") || 
                        combined.includes("pausa") || 
                        combined.includes("lanchinho") || 
                        combined.includes("trânsito") || 
                        combined.includes("deslocamento") || 
                        combined.includes("viagem");
          
          return {
            ...t,
            durationHours,
            isNVA
          };
        });

        const totalHours = parsedTasks.reduce((acc, t) => acc + t.durationHours, 0);
        const nvaHours = parsedTasks.filter(t => t.isNVA).reduce((acc, t) => acc + t.durationHours, 0);
        const vaHours = totalHours > 0 ? (totalHours - nvaHours) : 0;

        let vaPercentage = 80;
        let nvaPercentage = 20;

        if (totalHours > 0) {
          vaPercentage = Math.round((vaHours / totalHours) * 100);
          nvaPercentage = 100 - vaPercentage;
        }

        const bottlenecks: Bottleneck[] = [];
        const unnecessaryTimes: UnnecessaryTime[] = [];
        const recommendations: Recommendation[] = [];

        // Check for specific bottleneck conditions
        const hasWaiting = parsedTasks.some(t => t.isNVA);
        const hasLongTask = parsedTasks.some(t => t.durationHours >= 2.5);

        if (hasWaiting) {
          bottlenecks.push({
            title: "Latência de Fluxo por Espera Operacional",
            description: `Foi identificado que ${employeeName || "o operador"} gasta tempo relevante aguardando processos secundários, impactando a eficiência geral de cronoanálise.`,
            severity: "high"
          });
        }

        if (hasLongTask) {
          bottlenecks.push({
            title: "Atividade Crítica Sem Fracionamento",
            description: "Registros de longa duração contínua sem pausas de setup indicam que tarefas complexas podem estar sofrendo de falta de padronização ou roteiro estrito.",
            severity: "medium"
          });
        }

        // Default constraints if list empty
        if (bottlenecks.length === 0) {
          bottlenecks.push({
            title: "Despadronização de Movimentos Iniciais",
            description: "Tempo diluído no início das rotinas profissionais indica falta de checklist visual para aceleração de inicialização (setup rápido).",
            severity: "low"
          });
        }

        // Map wastes
        parsedTasks.forEach((t: any) => {
          if (t.isNVA) {
            unnecessaryTimes.push({
              activity: t.activity || "Atividade Operacional",
              wasteType: t.activity.toLowerCase().includes("deslocamento") ? "Transporte / Movimento" : "Espera (Waiting)",
              estimatedWastedMins: Math.round(t.durationHours * 60),
              explanation: "Identificado como tempo sem geração direta de valor no fluxo do processo produtivo."
            });
          }
        });

        if (unnecessaryTimes.length === 0) {
          unnecessaryTimes.push({
            activity: "Ajustificação de Ferramentais e Organização Manual",
            wasteType: "Processamento Excessivo",
            estimatedWastedMins: 30,
            explanation: "Período preliminar de separação de materiais que poderia ser otimizado com rotinas pré-estabelecidas 5S."
          });
        }

        // Map Recommendations
        if (hasWaiting) {
          recommendations.push({
            methodology: "Kanban & Poka-Yoke",
            action: `Implementar sinalização tática e quadros de controle de fluxo de forma que ${employeeName || "o colaborador"} nunca fique sem insumos disponíveis.`,
            expectedImpact: "Minimização de paradas inesperadas em até 35%."
          });
        }

        if (hasLongTask) {
          recommendations.push({
            methodology: "Trabalho Padronizado (Takt Time)",
            action: `Fracionar as etapas das tarefas maiores de forma a mapear precisamente o desperdício em cada subprocesso por cronometria direta.`,
            expectedImpact: "Incremento de 18% no rendimento operacional diário."
          });
        }

        recommendations.push({
          methodology: "Organização 5S & Seiri",
          action: "Definir local fixo demarcado para as ferramentas e materiais para reduzir o desperdício tático de movimentação desnecessária.",
          expectedImpact: "Ganho instantâneo de ergonomia e agilidade na rotina."
        });

        if (recommendations.length < 3) {
          recommendations.push({
            methodology: "Kaizen Semanal",
            action: "Estabelecer uma rodada rápida de brainstorming para simplificar as etapas burocráticas descritas nos relatórios operacionais.",
            expectedImpact: "Eliminação contínua de retrabalho administrativo."
          });
        }

        const summary = `[MODO INFORMATIVO / DEMO] Análise quantitativa profissional baseada nos dados do colaborador "${employeeName || "Equipe"}". Identificamos que o índice produtivo de agregação de valor (VA) está estimado em ${vaPercentage}%, enquanto as atividades acessórias e desperdícios (NVA) somam ${nvaPercentage}%. ${hasWaiting ? "A presença de tempos de espera ou paradas indica o primeiro grande vetor de melhoria tática." : "O fluxo produtivo apresenta-se contínuo, porém com potencial de fracionamento das tarefas de longa duração para eliminação de pontos cegos."}`;

        return res.json({
          summary,
          vaPercentage,
          nvaPercentage,
          bottlenecks,
          unnecessaryTimes,
          recommendations,
          isDemoMode: true
        });
      }

      // Prepare parts for the prompt
      const parts: any[] = [];

      let promptText = `Analise as seguintes atividades profissionais para o colaborador "${employeeName || "Equipe"}".\n\n`;
      promptText += `Método de análise solicitado: ${
        methodology === "lean" 
          ? "Lean Manufacturing & VA/NVA (Value-Added / Non-Value-Added Activities)" 
          : "Análise Ishikawa (Espinha de Peixe / 5 Whys / Causa Raiz) com análise de tempos e movimentos"
      }.\n\n`;
      promptText += "Histórico das tarefas registradas:\n";

      tasks.forEach((task: any, idx: number) => {
        promptText += `- [Tarefa ${idx + 1}]
  * Atividade: ${task.activity}
  * Data: ${task.date}
  * Período: ${task.startTime} às ${task.endTime || "Em andamento"}
  * Duração: ${task.totalHours}
  * Notas adicionais: ${task.notes || "Sem notas"}
`;

        // Include image attachments if they exist as base64
        if (task.attachments && Array.isArray(task.attachments)) {
          task.attachments.forEach((att: any) => {
            if (att.type === "photo" && att.url && att.url.startsWith("data:image/")) {
              try {
                const commaIdx = att.url.indexOf(",");
                if (commaIdx !== -1) {
                  const mimeType = att.url.substring(5, att.url.indexOf(";"));
                  const base64Data = att.url.substring(commaIdx + 1);
                  
                  parts.push({
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  });
                  promptText += `  * (Foto em anexo enviada à IA para análise visual das evidências correspondente a este lançamento)\n`;
                }
              } catch (e) {
                console.error("Erro ao converter base64 para Gemini inlineData: ", e);
              }
            }
          });
        }
        promptText += "\n";
      });

      promptText += `
Instruções profissionais de análise:
1. Calcule uma estimativa profissional de porcentagem de atividades que trazem valor real (Value-Added - VA) versus desperdícios / atividades sem real valor para o processo (Non-Value-Added - NVA). Ex: separação de materiais produtiva é VA, tempo esperando liberação de material ou ociosidade é NVA.
2. Identifique os principais gargalos ("gargalos") operacionais relatados no histórico e observe as evidências visuais enviadas. Descreva pormenorizadamente o problema e atribua uma severidade ("high", "medium", "low").
3. Indique as atividades que contêm desperdícios flagrantes ou tempos excessivos desnecessários ("tempos desnecessários"). Classifique o tipo de waste (Muda) envolvido: Espera (Waiting), Transporte (Transportation), Movimentação (Motion), Retrabalho (Defect), Superprodução (Overproduction) ou Processamento excessivo (Overprocessing). Atribua uma estimativa realista de minutos perdidos ("estimatedWastedMins") baseada no total de horas.
4. Redija 3 a 4 recomendações práticas de engenharia de processos / melhoria contínua (estilo Kaizen, 5S, poka-yoke, gestão visual Kanban, cronoanálise ou readequação de layout), relacionando-as a uma metodologia específica.

Gere uma resposta profissional estruturada estritamente sob o seguinte esquema JSON (sem textos adicionais fora do JSON):
{
  "summary": "Resumo geral, analítico e polido da rotina do operador em português brasileiro, identificando eficiência geral e oportunidades de melhoria.",
  "vaPercentage": 75, // número de 0 a 100
  "nvaPercentage": 25, // número de 0 a 100
  "bottlenecks": [
    {
      "title": "Identificação curta do gargalo",
      "description": "Explicação técnica sobre este ponto cego ou gargalo operacional fundamentando as evidências textuais ou visuais do dia.",
      "severity": "high" // ou "medium" ou "low"
    }
  ],
  "unnecessaryTimes": [
    {
      "activity": "Tarefa ou atividade contendo o desperdício",
      "wasteType": "Espera / Retrabalho / Movimentação Extra / Outros",
      "estimatedWastedMins": 30, // estimativa de minutos desperdiçados
      "explanation": "Fundamentação do tempo ocioso ou excessivo gasto neste item."
    }
  ],
  "recommendations": [
    {
      "methodology": "5S / Gestão Visual / Padrão de Trabalho / Kaizen",
      "action": "Ação recomendada específica e prática para eliminar este desperdício.",
      "expectedImpact": "Melhoria estimada na vazão ou aproveitamento de horas."
    }
  ]
}
`;

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              vaPercentage: { type: Type.INTEGER },
              nvaPercentage: { type: Type.INTEGER },
              bottlenecks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING }
                  },
                  required: ["title", "description", "severity"]
                }
              },
              unnecessaryTimes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    activity: { type: Type.STRING },
                    wasteType: { type: Type.STRING },
                    estimatedWastedMins: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["activity", "wasteType", "estimatedWastedMins", "explanation"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    methodology: { type: Type.STRING },
                    action: { type: Type.STRING },
                    expectedImpact: { type: Type.STRING }
                  },
                  required: ["methodology", "action", "expectedImpact"]
                }
              }
            },
            required: ["summary", "vaPercentage", "nvaPercentage", "bottlenecks", "unnecessaryTimes", "recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      return res.json(parsedData);

    } catch (err: any) {
      console.error("AI Analysis endpoint error: ", err);
      return res.status(500).json({ error: "Erro interno na análise da inteligência artificial: " + err.message });
    }
  });

  // Setup Vite Dev Server / Production routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Static assets served from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express node process bound to port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start custom server:", err);
});
