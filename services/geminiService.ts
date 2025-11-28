
import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";
import { PatientData } from "../types";

const apiKey = process.env.API_KEY || ''; 

let genAI: GoogleGenAI | null = null;

if (apiKey) {
  genAI = new GoogleGenAI({ apiKey });
}

export const analyzePatientVitals = async (patient: PatientData): Promise<string> => {
  // if (!genAI) {
  //   return "API Key 未配置。无法使用AI分析功能。";
  // }

  try {
    // Construct dynamic vitals string
    /*
    const vitalsStr = patient.parameters
      .map(p => `- ${p.label}: ${p.value} ${p.unit}`)
      .join('\n');

    const prompt = `
    请分析以下医疗设备数据:
    设备类型: ${patient.deviceType}
    患者: ${patient.name} (${patient.age}岁 ${patient.gender})
    床位: ${patient.bedNumber}
    
    当前监测参数:
    ${vitalsStr}
    
    请根据设备类型和上述数据提供临床评估，指出潜在风险（如呼吸机对抗、通气不足、循环衰竭、恶性心律失常等），并给出建议的即时处理措施。请务必使用中文回答。
    `;

    // Fix: Use genAI instance instead of undefined 'ai' variable
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        temperature: 0.4, 
      }
    });

    return response.text || "未能生成分析结果。";
    */
    return "AI 智能分析功能暂时关闭 (System Maintenance)。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI分析过程中发生错误，请稍后重试。";
  }
};
