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
 * Calculates Token Overlap (Jaccard Index) for keyword coverage.
 */
function calculateTokenOverlap(a: string, b: string): number {
    const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(t => t.length > 2));
    const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(t => t.length > 2));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);

    return intersection.size / union.size;
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

    // 2. Token Overlap (Keywords) - Weight: 60%
    const tokenScore = calculateTokenOverlap(cleanStudent, cleanModel) * 100;

    // 3. Levenshtein (Spelling/Phrasing) - Weight: 40%
    const distance = levenshteinDistance(cleanStudent, cleanModel);
    const maxLength = Math.max(cleanStudent.length, cleanModel.length);
    const levenshteinScore = ((maxLength - distance) / maxLength) * 100;

    // Weighted Final Score
    // Boost token score importance for longer answers where phrasing varies
    let finalScore = (tokenScore * 0.6) + (levenshteinScore * 0.4);

    // Heuristic: If token overlap is very high (>80%), boost confidence
    if (tokenScore > 80) finalScore = Math.max(finalScore, tokenScore);

    const threshold = 70; // Passing grade
    const isCorrect = finalScore >= threshold;

    return {
        score: Math.round(finalScore),
        isCorrect,
        confidence: Math.round(finalScore),
        reason: `AI Confidence: ${Math.round(finalScore)}% (Keywords: ${Math.round(tokenScore)}%, Phrasing: ${Math.round(levenshteinScore)}%)`
    };
}
