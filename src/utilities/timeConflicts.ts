import type { Course } from '../services/scheduleService';
import { parseCourseMeeting, type CourseMeeting } from './courseMeetings';

const daysOverlap = (a: CourseMeeting, b: CourseMeeting): boolean =>
  a.days.some((day) => b.days.indexOf(day) !== -1);

const timesOverlap = (a: CourseMeeting, b: CourseMeeting): boolean =>
  a.start < b.end && b.start < a.end;

const meetingsConflict = (a: CourseMeeting, b: CourseMeeting): boolean =>
  daysOverlap(a, b) && timesOverlap(a, b);

const coursesConflict = (a: Course, b: Course): boolean => {
  if (a.id === b.id || a.term !== b.term) return false;

  const meetingA = parseCourseMeeting(a.meets);
  const meetingB = parseCourseMeeting(b.meets);
  return meetingA !== null && meetingB !== null && meetingsConflict(meetingA, meetingB);
};

export const getConflicts = (course: Course, selected: Course[]): Course[] =>
  selected.filter((other) => coursesConflict(course, other));

export const hasConflict = (course: Course, selected: Course[]): boolean =>
  getConflicts(course, selected).length > 0;
