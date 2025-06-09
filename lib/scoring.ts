import { Question, TestResult } from './types';

export function evaluateAnswer(question: Question, answer: string): boolean {
  switch (question.type) {
    case 'boolean':
      const boolAnswer = answer.toLowerCase().includes('yes') || answer.toLowerCase().includes('true');
      return question.expectedBoolean !== undefined ? boolAnswer === question.expectedBoolean : false;
    
    case 'number':
      const numAnswer = parseFloat(answer);
      if (isNaN(numAnswer) || question.threshold === undefined || !question.comparator) return false;
      
      switch (question.comparator) {
        case '>=': return numAnswer >= question.threshold;
        case '<=': return numAnswer <= question.threshold;
        case '>': return numAnswer > question.threshold;
        case '<': return numAnswer < question.threshold;
        case '==': return numAnswer === question.threshold;
        default: return false;
      }
    
    case 'enum':
      return question.expectedEnum ? answer.toLowerCase().includes(question.expectedEnum.toLowerCase()) : false;
    
    case 'lookup':
      return true; // Always pass for lookup questions
    
    default:
      return false;
  }
}

export function calculateScore(results: TestResult[]): { 
  finalScore: number; 
  baseScore: number; 
  hasCriticalFail: boolean; 
  verdict: string; 
} {
  if (results.length === 0) return { 
    finalScore: 0, 
    baseScore: 0, 
    hasCriticalFail: false, 
    verdict: 'No questions' 
  };
  
  // Check for critical failures
  const hasCriticalFail = results.some(r => r.critical && !r.passed);
  
  // Weighted base score calculation
  const total = results.reduce((sum, r) => sum + r.weight, 0);
  const earned = results.reduce((sum, r) => sum + (r.passed ? r.weight : 0), 0);
  const baseScore = total > 0 ? Math.round((earned / total) * 100) : 0;
  
  // Final score and verdict
  const finalScore = hasCriticalFail ? 0 : baseScore;
  const verdict = hasCriticalFail ? 'Fail (critical)' :
                  baseScore >= 70 ? 'Bid' : 'Pass';
  
  return { finalScore, baseScore, hasCriticalFail, verdict };
} 