const SCHEDULE_ENDPOINT =
  'https://courses.cs.northwestern.edu/394/guides/data/cs-courses-firestore.php';

const SCHEDULE_ID = 'CS-2018-2019';

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
  if (!isRecord(payload) || !isRecord(payload.schedules)) {
    throw new Error('The course schedule response has an unexpected format.');
  }

  const schedule = payload.schedules[SCHEDULE_ID];

  if (
    !isRecord(schedule) ||
    typeof schedule.title !== 'string' ||
    !isRecord(schedule.courses)
  ) {
    throw new Error('The course schedule response has an unexpected format.');
  }

  const courseData = schedule.courses;

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
    title: schedule.title,
    courses,
  };
};

export const fetchCourseSchedule = async (
  signal: AbortSignal,
): Promise<CourseSchedule> => {
  let response: Response;

  try {
    response = await fetch(SCHEDULE_ENDPOINT, { signal });
  } catch (cause) {
    if (signal.aborted) {
      throw cause;
    }

    throw new Error(
      'Could not connect to the course schedule service. Check your connection and try again.',
    );
  }

  if (!response.ok) {
    throw new Error(
      `The course schedule request failed (HTTP ${response.status}).`,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error('The course schedule service returned invalid JSON.');
  }

  return parseSchedule(payload);
};