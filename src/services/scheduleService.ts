export const SCHEDULE_PATH = 'schedules/CS-2018-2019';

const TERM_ORDER = ['Fall', 'Winter', 'Spring'] as const;

export type CourseTerm = (typeof TERM_ORDER)[number];

export interface Course {
  id: string;
  term: CourseTerm;
  number: string;
  meets: string;
  title: string;
}

export interface CourseSchedule {
  title: string;
  courses: Course[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCourseTerm = (value: unknown): value is CourseTerm =>
  TERM_ORDER.some((term) => term === value);

const parseSchedule = (payload: unknown): CourseSchedule => {
  if (
    !isRecord(payload) ||
    typeof payload.title !== 'string' ||
    !isRecord(payload.courses)
  ) {
    throw new Error('The course schedule response has an unexpected format.');
  }

  const courseData = payload.courses;

  const courses = Object.keys(courseData).map((id) => {
    const value = courseData[id];

    if (
      !isRecord(value) ||
      !isCourseTerm(value.term) ||
      typeof value.number !== 'string' ||
      typeof value.meets !== 'string' ||
      typeof value.title !== 'string'
    ) {
      throw new Error(
        `The course schedule contains invalid course data (${id}).`,
      );
    }

    return {
      id,
      term: value.term,
      number: value.number,
      meets: value.meets,
      title: value.title,
    };
  });

  courses.sort(
    (left, right) =>
      TERM_ORDER.indexOf(left.term) - TERM_ORDER.indexOf(right.term),
  );

  return {
    title: payload.title,
    courses,
  };
};

export const safeParseSchedule = (
  payload: unknown,
): { schedule?: CourseSchedule; error?: Error } => {
  if (payload === null) {
    return { error: new Error('The course schedule was not found in Firebase.') };
  }

  try {
    return { schedule: parseSchedule(payload) };
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause : new Error('The course schedule is invalid.'),
    };
  }
};
