import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const DAYS = '(M|Tu|W|Th|F|Sa|Su)+';
const TIME = '([01]?\\d|2[0-3]):[0-5]\\d';
const MEETING_PATTERN = new RegExp(`^${DAYS} ${TIME}-${TIME}$`);

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const hasValidTimespan = (meets: string): boolean => {
  const [start, end] = meets.split(' ')[1].split('-').map(toMinutes);
  return start < end;
};

const isLegalMeeting = (meets: string): boolean =>
  meets === '' || (MEETING_PATTERN.test(meets) && hasValidTimespan(meets));

export const CourseForm = z.object({
  title: z.string().trim().min(2, 'must be at least 2 characters'),
  term: z.enum(['Fall', 'Winter', 'Spring', 'Summer'], {
    error: 'must be Fall, Winter, Spring, or Summer',
  }),
  number: z
    .string()
    .trim()
    .regex(/^\d+(-\d+)?$/, 'must be a number with an optional section, e.g., 213-2'),
  meets: z
    .string()
    .trim()
    .refine(isLegalMeeting, 'must contain days and start-end, e.g., MWF 12:00-13:20'),
});

export type CourseForm = z.infer<typeof CourseForm>;

export const courseFormResolver = zodResolver(CourseForm);
