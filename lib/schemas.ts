import { z } from 'zod';

export const UserSchema = z.object({
    id: z.number().optional(),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'admin']).default('student'),
});

export const LoginSchema = z.object({
    username: z.string().nonempty('Username is required'),
    password: z.string().nonempty('Password is required'),
});

export const QuestionOptionSchema = z.object({
    id: z.string(),
    text: z.string().nonempty('Option text is required'),
});

export const QuestionSchema = z.object({
    id: z.number().optional(),
    type: z.enum(['mcq', 'text']),
    prompt: z.string().nonempty('Question prompt is required'),
    options: z.array(QuestionOptionSchema).optional(), // stored as JSON in DB
    correctAnswer: z.string().optional(), // for grading
});

export const TestSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(3, 'Title is too short'),
    description: z.string().optional(),
    duration_minutes: z.number().min(1, 'Duration must be at least 1 minute'),
    start_time: z.string().datetime().optional(),
    end_time: z.string().datetime().optional(),
    questions: z.array(QuestionSchema).optional(),
});

export const ResultSchema = z.object({
    test_id: z.number(),
    student_username: z.string(),
    answers: z.record(z.string(), z.string()), // questionId -> answer
    score: z.number().optional(),
    submitted_at: z.string().datetime().optional(),
});
