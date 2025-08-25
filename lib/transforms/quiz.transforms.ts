/**
 * 🔄 Quiz Transform Utilities
 * 
 * Centralized data transformation logic for quiz-related data.
 * Eliminates scattered transform code in components.
 */

import type { Answer, QuestionWithAnswers } from "@/lib/types";
import { z } from 'zod';

// สร้าง Zod schema สำหรับ validation
const RawAnswerSchema = z.object({
  id: z.string(),
  text: z.string(),
  is_correct: z.boolean().optional(),
  explanation: z.string().optional()
});

const RawAnswerArraySchema = z.array(RawAnswerSchema);

/**
 * Transform a single answer to frontend Answer type
 */
const transformAnswer = (answer: z.infer<typeof RawAnswerSchema>): Answer => ({
  id: answer.id,
  text: answer.text,
  isCorrect: answer.is_correct || false
});

// Database answer type (from Supabase)
export interface DbAnswer {
  id: string;
  answer_text: string;
  is_correct: boolean;
}

// Unified answer type for frontend
export type RawAnswer = Answer | DbAnswer;

/**
 * Transform database answers to frontend Answer type
 */
export const transformDbAnswers = (rawAnswers: RawAnswer[]): Answer[] => {
  if (!Array.isArray(rawAnswers)) {
    console.warn("[transformDbAnswers] Input is not an array:", rawAnswers);
    return [];
  }

  return rawAnswers.map((ans) => {
    // Already in correct format
    if ("text" in ans && "isCorrect" in ans) {
      return ans as Answer;
    }

    // Transform from DB format
    const dbAns = ans as DbAnswer;
    return {
      id: dbAns.id,
      text: dbAns.answer_text,
      isCorrect: dbAns.is_correct,
    } satisfies Answer;
  });
};

/**
 * Transform question with answers from database format
 */
export const transformQuestionWithAnswers = (
  question: QuestionWithAnswers
): QuestionWithAnswers & { transformedAnswers: Answer[] } => {
  let transformedAnswers: Answer[] = []
  
  if (question.answers) {
    try {
      // Parse JSON ถ้าเป็น string
      let parsedAnswers: unknown
      if (typeof question.answers === 'string') {
        parsedAnswers = JSON.parse(question.answers)
      } else {
        parsedAnswers = question.answers
      }
      
      // Validate กับ Zod schema
      const validatedAnswers = RawAnswerArraySchema.parse(parsedAnswers)
      transformedAnswers = validatedAnswers.map(transformAnswer)
      
    } catch (error) {
      console.error('Failed to parse/validate answers:', error)
      console.error('Raw answers data:', question.answers)
    }
  }
  
  return {
    ...question,
    transformedAnswers
  }
};

/**
 * Get correct answer from a list of answers
 */
export const getCorrectAnswer = (answers: Answer[]): Answer | null => {
  return answers.find(ans => ans.isCorrect) || null;
};

/**
 * Check if a selected answer is correct
 */
export const isAnswerCorrect = (answers: Answer[], selectedId: string): boolean => {
  const answer = answers.find(ans => ans.id === selectedId);
  return answer?.isCorrect || false;
};

/**
 * Calculate quiz score from responses
 */
export const calculateQuizScore = (responses: Array<{ isCorrect: boolean }>) => {
  const correctCount = responses.filter(r => r.isCorrect).length;
  const total = responses.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  
  return {
    score: correctCount,
    total,
    percentage,
    scoreOutOfTen: total > 0 ? Math.round((correctCount / total) * 10) : 0
  };
};

/**
 * Determine risk level based on score
 */
export const getRiskLevel = (score: number, total: number): 'high' | 'medium' | 'low' => {
  const scoreOutOfTen = total > 0 ? Math.round((score / total) * 10) : 0;
  
  if (scoreOutOfTen <= 3) return 'high';
  if (scoreOutOfTen < 9) return 'medium';
  return 'low';
};

/**
 * Get risk assessment data for result display
 */
export const getRiskAssessment = (score: number, total: number) => {
  const riskLevel = getRiskLevel(score, total);
  const scoreOutOfTen = total > 0 ? Math.round((score / total) * 10) : 0;
  
  const assessments = {
    high: {
      scoreLabel: `${scoreOutOfTen}/10`,
      title: "คุณเสี่ยงตกเป็นเหยื่อมิจฉาชีพ",
      imageSrc: "/images/results/risk-high.svg",
      imageAlt: `ผลลัพธ์ความเสี่ยงสูง (${scoreOutOfTen}/10)`,
      tips: [
        "อย่าหลงเชื่อเมื่อมีคนเสนอเงินหรือขู่บังคับ",
        "ปรึกษาคนรอบข้าง และค้นหาข้อมูลก่อน",
        "ห้ามโอนเงิน หากเผลอโอนแล้วอย่าโอนเพิ่ม",
        "ถ้าถูกหลอก ติดต่อสายด่วน 1441 เท่านั้น",
      ],
    },
    medium: {
      scoreLabel: `${scoreOutOfTen}/10`,
      title: "คุณพอจับพิรุธมิจฉาชีพได้",
      imageSrc: "/images/results/risk-medium.svg",
      imageAlt: `ผลลัพธ์ระดับกลาง (${scoreOutOfTen}/10)`,
      tips: [
        "อย่าเชื่อข้อเสนอที่ดีเกินจริง แม้ดูน่าเชื่อถือ",
        "ตรวจสอบชื่อบัญชี เบอร์โทร และเว็บไซต์ทุกครั้ง",
        "ไม่โอนเงินให้ และหยุดทันทีหากถูกจูงใจเพิ่ม",
        "หากสงสัยว่าจะถูกโกง ติดต่อสายด่วน 1441",
      ],
    },
    low: {
      scoreLabel: `${scoreOutOfTen}/10`,
      title: "คุณรู้เท่าทันมิจฉาชีพ",
      imageSrc: "/images/results/risk-low.svg",
      imageAlt: `ผลลัพธ์ดีมาก (${scoreOutOfTen}/10)`,
      tips: [
        "แยกแยะข้อเสนอหลอกลวงและรู้ทันกลโกงได้",
        "มีทักษะด้านความปลอดภัยไซเบอร์",
        "ย้ำเตือนคนรอบข้าง ไม่ให้แชร์หรือโอนเงิน",
        "หากพบคนถูกหลอก ส่งต่อข้อมูลให้โทร 1441",
      ],
    },
  } as const;

  return assessments[riskLevel];
};