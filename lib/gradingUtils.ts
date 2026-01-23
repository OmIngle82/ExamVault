export interface GradingResult {
    score: number; // 0 to 100
    isCorrect: boolean;
    confidence: number; // Same as score, but semantically distinct
    reason: string;
}

/**
 * Calculates Levenshtein Distance between two strings.
 * Lower distance = more similar.
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1,   // insertion
                        matrix[i - 1][j] + 1    // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculates Token Recall (How many model keywords are in the student answer?)
 * This is better than Jaccard because it doesn't penalize extra explanatory words.
 */
function calculateTokenRecall(student: string, model: string): number {
    const tokensStudent = new Set(student.toLowerCase().split(/\W+/).filter(t => t.length > 2));
    const tokensModel = new Set(model.toLowerCase().split(/\W+/).filter(t => t.length > 2));

    if (tokensModel.size === 0) return 0;

    const intersection = new Set([...tokensModel].filter(x => tokensStudent.has(x)));

    // Recall: What % of the required model keywords did the student hit?
    return intersection.size / tokensModel.size;
}

export function gradeAnswer(studentAnswer: string, modelAnswer: string): GradingResult {
    if (!studentAnswer || !modelAnswer) {
        return { score: 0, isCorrect: false, confidence: 0, reason: 'Missing input' };
    }

    const cleanStudent = studentAnswer.trim().toLowerCase();
    const cleanModel = modelAnswer.trim().toLowerCase();

    // 1. Exact Match (Instant 100)
    if (cleanStudent === cleanModel) {
        return { score: 100, isCorrect: true, confidence: 100, reason: 'Exact match' };
    }

    // 2. Substring Match (Instant 95) - If user wrote "The capital is Paris" and answer is "Paris"
    if (cleanStudent.includes(cleanModel)) {
        return { score: 95, isCorrect: true, confidence: 95, reason: 'Contains exact answer' };
    }

    // 3. Token Recall (Keywords) - Primary Driver
    // If student mentions all key words, they should pass.
    const tokenScore = calculateTokenRecall(cleanStudent, cleanModel) * 100;

    // 4. Levenshtein (Spelling/Phrasing) - Secondary backup for short answers
    const distance = levenshteinDistance(cleanStudent, cleanModel);
    const maxLength = Math.max(cleanStudent.length, cleanModel.length);
    const levenshteinScore = ((maxLength - distance) / maxLength) * 100;

    // Weighted Final Score
    // We prioritize Token Recall (70%) because semantics matter more than structure
    let finalScore = (tokenScore * 0.7) + (levenshteinScore * 0.3);

    // Boost: If Recall is 100% (all keywords found), minimum score is 85%
    if (tokenScore >= 100) {
        finalScore = Math.max(finalScore, 85);
    }

    // Boost: If simple typo (Levenshtein > 80%), minimum score is 80%
    if (levenshteinScore > 80) {
        finalScore = Math.max(finalScore, 80);
    }

    // Lenient Threshold
    const threshold = 60;
    const isCorrect = finalScore >= threshold;

    return {
        score: Math.round(finalScore),
        isCorrect,
        confidence: Math.round(finalScore),
        reason: `AI Confidence: ${Math.round(finalScore)}% (Keywords: ${Math.round(tokenScore)}%, Match: ${Math.round(levenshteinScore)}%)`
    };
}
