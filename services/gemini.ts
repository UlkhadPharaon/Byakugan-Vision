import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { Target, SocialAudit } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const scanSector = async (sector: string, region: string, trigger: string): Promise<Target[]> => {
  const ai = getClient();
  
  // 1. QUERY EXPANSION (Invisible Step)
  // We explicitly ask the model to broaden the horizon before narrowing down.
  const prompt = `
    ANALYSE DU SECTEUR : ${sector}
    ZONE GÉOGRAPHIQUE : ${region}
    DÉCLENCHEUR RECHERCHÉ (TRIGGER) : ${trigger === 'ALL' ? 'Tout signal de croissance' : trigger}
    
    Exécute le protocole BYAKUGAN SCAN.
    
    RÈGLES D'ENGAGEMENT :
    1. EXPANSION : Ne cherche pas seulement le mot clé exact "${sector}". Cherche aussi les sous-niches adjacentes et synonymes pertinents dans cette région.
    2. FILTRAGE PAR TRIGGER : Priorise ABSOLUMENT les entreprises qui correspondent au déclencheur : ${trigger}.
       - Si "Levée de fonds" : Cherche "Seed", "Series A", "Investissement".
       - Si "Nouveau CEO" : Cherche "Nomination", "Prise de fonction", "Directeur Général".
       - Si "Recrutement" : Cherche "Campagne de recrutement", "Offres d'emploi massives".
    3. URGENCE : Evalue la date de l'info.
       - HOT : Moins de 30 jours.
       - WARM : 1 à 6 mois.
       - COLD : + de 6 mois.
    
    Trouve 8 cibles ULTRA PERTINENTES.
    Utilise Google Search pour vérifier les actualités récentes (2024-2025).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        thinkingConfig: {
            thinkingBudget: 16000, 
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  name: { type: Type.STRING },
                  location: { type: Type.STRING },
                  growthSignal: { type: Type.STRING },
                  triggerType: { type: Type.STRING, enum: ['FUNDING', 'HIRING', 'EXECUTIVE', 'EXPANSION', 'PRODUCT', 'OTHER'] },
                  urgencyScore: { type: Type.STRING, enum: ['HOT', 'WARM', 'COLD'] },
                  visualGap: { type: Type.STRING },
                  attackAngle: { type: Type.STRING },
                  humanTarget: { type: Type.STRING },
                  sourceLinks: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["id", "name", "location", "growthSignal", "triggerType", "urgencyScore", "visualGap", "attackAngle", "humanTarget"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from HQ.");

    const data = JSON.parse(text);
    return data.targets || [];

  } catch (error) {
    console.error("Transmission Intercepted:", error);
    throw error;
  }
};

export const analyzeDeepDive = async (target: Target): Promise<SocialAudit> => {
  const ai = getClient();

  const prompt = `
    CIBLE : ${target.name} (${target.location})
    DECIDEUR : ${target.humanTarget}
    FAILLE IDENTIFIÉE : ${target.visualGap}
    SIGNAL : ${target.triggerType} (${target.growthSignal})

    MISSION :
    1. Évalue la qualité de leur "Chakra Visuel" (Branding, Web, Social).
    2. GÉNÈRE UN PLAN D'ATTAQUE "CINEMATIC" (Tactiques) adapté au SIGNAL identifié.
       - Email Subject : Un objet d'email froid impossible à ignorer pour le décideur.
       - LinkedIn Hook : La première phrase d'un post pour les interpeller.
       - Video Concept : Une idée de vidéo courte (30s) pour prouver notre valeur.
    
    CRITÈRES DE NOTATION (Score sur 10) :
    1-3 : Amateur (Chakra Faible).
    4-6 : Standard (Chakra Moyen).
    7-10 : Premium (Chakra Puissant).

    FORMAT JSON ATTENDU :
    {
      "score": number,
      "chakraLevel": "FAIBLE" | "MOYEN" | "PUISSANT",
      "critique": "Analyse cinglante en 1 phrase.",
      "tactics": {
         "emailSubject": "Objet de l'email",
         "linkedInHook": "Accroche LinkedIn",
         "videoConcept": "Concept vidéo"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        }
    });
    
    if (!response.text) throw new Error("Vision bloquée");
    return JSON.parse(response.text) as SocialAudit;
  } catch (e) {
      console.error(e);
      return {
          score: 0,
          chakraLevel: 'FAIBLE',
          critique: "Impossible de percer le voile numérique.",
          tactics: {
            emailSubject: "Erreur de décryptage",
            linkedInHook: "Erreur de décryptage",
            videoConcept: "Erreur de décryptage"
          }
      };
  }
};

export const generateMissionBriefing = async (target: Target): Promise<string | null> => {
    const ai = getClient();
    
    const briefingText = `
      Priorité : ${target.urgencyScore === 'HOT' ? 'Immédiate' : 'Standard'}.
      Cible : ${target.name}. 
      Déclencheur identifié : ${target.triggerType}. ${target.growthSignal}.
      Point faible : ${target.visualGap}.
      Décideur : ${target.humanTarget}.
      Terminé.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: briefingText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' }, 
              },
          },
        },
      });
  
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || null;
  
    } catch (error) {
      console.error("Audio comms jammed:", error);
      return null;
    }
  };