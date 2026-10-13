import type { Course } from '../services/scheduleService';

interface Meeting {
  days: string[];
  start: number;
  end: number;
}

const DAY_PATTERN = /M|Tu|W|Th|F|Sa|Su/g;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const parseMeeting = (meets: string): Meeting | null => {
  const [dayText, timeText] = meets.trim().split(' ');
  if (!dayText || !timeText) return null;

  const [start, end] = timeText.split('-').map(toMinutes);
  return { days: dayText.match(DAY_PATTERN) ?? [], start, end };
};

const daysOverlap = (a: Meeting, b: Meeting): boolean =>
  a.days.some((day) => b.days.indexOf(day) !== -1);

const timesOverlap = (a: Meeting, b: Meeting): boolean =>
  a.start < b.end && b.start < a.end;

const meetingsConflict = (a: Meeting, b: Meeting): boolean =>
  daysOverlap(a, b) && timesOverlap(a, b);

const coursesConflict = (a: Course, b: Course): boolean => {
  if (a.id === b.id || a.term !== b.term) return false;

  const meetingA = parseMeeting(a.meets);
  const meetingB = parseMeeting(b.meets);
  return meetingA !== null && meetingB !== null && meetingsConflict(meetingA, meetingB);
};

export const hasConflict = (course: Course, selected: Course[]): boolean =>
  selected.some((other) => coursesConflict(course, other));