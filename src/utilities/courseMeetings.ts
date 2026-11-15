export type CourseWeekday = 'M' | 'Tu' | 'W' | 'Th' | 'F' | 'Sa' | 'Su';

export interface CourseMeeting {
  days: CourseWeekday[];
  start: number;
  end: number;
}

const DAY_PATTERN = /Tu|Th|Sa|Su|M|W|F/g;
const COURSE_WEEKDAYS: CourseWeekday[] = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];

const isCourseWeekday = (day: string): day is CourseWeekday =>
  COURSE_WEEKDAYS.some((weekday) => weekday === day);

const parseTime = (time: string): number | undefined => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return undefined;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;

  return hours * 60 + minutes;
};

export const parseCourseMeeting = (meets: string): CourseMeeting | null => {
  const match = /^([A-Za-z]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(
    meets.trim(),
  );
  if (!match) return null;

  const parsedDays = match[1].match(DAY_PATTERN) ?? [];
  const dayCodes: CourseWeekday[] = [];
  for (const day of parsedDays) {
    if (!isCourseWeekday(day)) return null;
    dayCodes.push(day);
  }
  if (dayCodes.join('') !== match[1]) return null;

  const start = parseTime(match[2]);
  const end = parseTime(match[3]);
  if (start === undefined || end === undefined || end <= start) return null;

  return { days: dayCodes, start, end };
};
