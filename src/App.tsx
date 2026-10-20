import { useEffect, useState, type ReactNode } from 'react';
import {
  fetchCourseSchedule,
  type Course,
  type CourseSchedule,
  type CourseTerm,
} from './services/scheduleService';
import { useForm } from 'react-hook-form';
import { hasConflict } from './utilities/timeConflicts';
import { CourseForm, courseFormResolver } from './types/courseForm';

const terms: CourseTerm[] = ['Fall', 'Winter', 'Spring'];
const formTerms = CourseForm.shape.term.options;

// ---------- Modal ----------

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900" id="modal-title">
            {title}
          </h2>
          <button
            aria-label={`Close ${title.toLowerCase()}`}
            className="rounded-md px-3 py-1 text-2xl leading-none text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
};

// ---------- Term selector ----------

interface TermSelectorProps {
  selection: CourseTerm;
  setSelection: (term: CourseTerm) => void;
}

const TermSelector = ({ selection, setSelection }: TermSelectorProps) => (
  <div aria-label="Select academic term" className="flex flex-wrap gap-2" role="group">
    {terms.map((term) => {
      const isSelected = term === selection;

      return (
        <button
          aria-pressed={isSelected}
          className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
            isSelected
              ? 'border-blue-700 bg-blue-700 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
          }`}
          key={term}
          onClick={() => setSelection(term)}
          type="button"
        >
          {term}
        </button>
      );
    })}
  </div>
);

// ---------- Course list ----------

interface CourseListProps {
  courses: Course[];
  selection: CourseTerm;
  selectedIds: Set<string>;
  selectedCourses: Course[];
  toggleSelected: (courseId: string) => void;
  onEdit: (courseId: string) => void;
}

const CourseList = ({
  courses,
  selection,
  selectedIds,
  selectedCourses,
  toggleSelected,
  onEdit,
}: CourseListProps) => {
  const termCourses = courses.filter((course) => course.term === selection);

  if (termCourses.length === 0) {
    return (
      <p className="font-sans text-gray-700">
        No {selection} courses are currently available.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] items-stretch gap-3">
      {termCourses.map((course) => {
        const isSelected = selectedIds.has(course.id);
        const isBlocked = !isSelected && hasConflict(course, selectedCourses);

        return (
          <li
            className="flex min-w-0 flex-col items-start gap-2"
            key={course.id}
          >
            <button
              aria-pressed={isSelected}
              disabled={isBlocked}
              className={`flex h-full w-full flex-col rounded-lg border p-4 text-left font-sans shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 text-gray-900'
                  : isBlocked
                    ? 'cursor-not-allowed border-gray-300 bg-white text-gray-500 opacity-50'
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => toggleSelected(course.id)}
              type="button"
            >
              <span className="mb-3 flex w-full items-center justify-between gap-2 text-xl font-medium leading-snug">
                <span>
                  <span className="text-blue-700">{course.term}</span> CS{' '}
                  {course.number}
                </span>
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm text-white"
                  >
                    ✓
                  </span>
                )}
                {isBlocked && (
                  <span
                    aria-hidden="true"
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700"
                  >
                    ✕
                  </span>
                )}
              </span>
              {isBlocked && (
                <span className="sr-only">
                  Unavailable because it conflicts with a selected course.
                </span>
              )}
              <span className="mb-4 block text-base leading-relaxed text-gray-700">
                {course.title}
              </span>
              <span className="mt-auto block w-full border-t border-gray-200 pt-3 text-[0.9375rem] text-gray-700">
                {course.meets}
              </span>
            </button>
            <a
              className="font-sans text-sm font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              href={`/courses/${encodeURIComponent(course.id)}/edit`}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return;
                }

                event.preventDefault();
                onEdit(course.id);
              }}
            >
              Edit
            </a>
          </li>
        );
      })}
    </ul>
  );
};

// ---------- Course plan (pop-up content) ----------

const CoursePlan = ({ selected }: { selected: Course[] }) =>
  selected.length === 0 ? (
    <p className="text-gray-700">
      No courses selected yet. Close this window and click a course card to add
      it to your plan.
    </p>
  ) : (
    <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
      {selected.map((course) => (
        <li className="border-b border-gray-200 pb-3 last:border-b-0" key={course.id}>
          <h3 className="font-semibold text-gray-900">
            {course.term} CS {course.number}: {course.title}
          </h3>
          <p className="mt-1 text-sm text-gray-700">{course.meets}</p>
        </li>
      ))}
    </ul>
  );

// ---------- Term page ----------

interface TermPageProps {
  courses: Course[];
  onEdit: (courseId: string) => void;
}

const TermPage = ({ courses, onEdit }: TermPageProps) => {
  const [selection, setSelection] = useState<CourseTerm>('Fall');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const toggleSelected = (courseId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }

      return next;
    });
  };

  const selectedCourses = courses.filter((course) => selectedIds.has(course.id));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-sans">
        <TermSelector selection={selection} setSelection={setSelection} />
        <button
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
          onClick={() => setIsPlanOpen(true)}
          type="button"
        >
          Course plan
        </button>
      </div>

      <CourseList
        courses={courses}
        selection={selection}
        selectedIds={selectedIds}
        selectedCourses={selectedCourses}
        toggleSelected={toggleSelected}
        onEdit={onEdit}
      />

      <Modal isOpen={isPlanOpen} onClose={() => setIsPlanOpen(false)} title="Course plan">
        <CoursePlan selected={selectedCourses} />
      </Modal>
    </>
  );
};

interface CourseEditPageProps {
  course: Course | undefined;
  onCancel: () => void;
}

const fieldClass = (hasError: boolean) =>
  `w-full rounded-md border px-3 py-2 text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
    hasError ? 'border-red-500' : 'border-gray-300'
  }`;

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p className="mt-1 text-sm text-red-700" id={id}>
      {message}
    </p>
  ) : null;

const CourseEditForm = ({ course, onCancel }: { course: Course; onCancel: () => void }) => {
  const {
    register,
    formState: { errors },
  } = useForm<CourseForm>({
    defaultValues: {
      title: course.title,
      term: course.term,
      number: course.number,
      meets: course.meets,
    },
    mode: 'onChange',
    resolver: courseFormResolver,
  });

  return (
    <form className="space-y-4" noValidate onSubmit={(event) => event.preventDefault()}>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-term">
          Term
        </label>
        <select
          aria-describedby="course-term-error"
          aria-invalid={Boolean(errors.term)}
          className={fieldClass(Boolean(errors.term))}
          id="course-term"
          {...register('term')}
        >
          {formTerms.map((term) => (
            <option key={term} value={term}>
              {term}
            </option>
          ))}
        </select>
        <FieldError id="course-term-error" message={errors.term?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-number">
          Course number
        </label>
        <input
          aria-describedby="course-number-error"
          aria-invalid={Boolean(errors.number)}
          className={fieldClass(Boolean(errors.number))}
          id="course-number"
          type="text"
          {...register('number')}
        />
        <FieldError id="course-number-error" message={errors.number?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-title">
          Course title
        </label>
        <input
          aria-describedby="course-title-error"
          aria-invalid={Boolean(errors.title)}
          className={fieldClass(Boolean(errors.title))}
          id="course-title"
          type="text"
          {...register('title')}
        />
        <FieldError id="course-title-error" message={errors.title?.message} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-meets">
          Meeting times
        </label>
        <input
          aria-describedby="course-meets-error"
          aria-invalid={Boolean(errors.meets)}
          className={fieldClass(Boolean(errors.meets))}
          id="course-meets"
          type="text"
          {...register('meets')}
        />
        <FieldError id="course-meets-error" message={errors.meets?.message} />
      </div>

      <button
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
    </form>
  );
};

const CourseEditPage = ({ course, onCancel }: CourseEditPageProps) => {
  if (!course) {
    return (
      <section className="font-sans" aria-labelledby="edit-course-title">
        <h2 className="mb-4 text-2xl font-semibold" id="edit-course-title">
          Course not found
        </h2>
        <button
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-lg font-sans" aria-labelledby="edit-course-title">
      <h2 className="mb-4 text-2xl font-semibold text-gray-900" id="edit-course-title">
        Edit {course.term} CS {course.number}
      </h2>
      <CourseEditForm course={course} onCancel={onCancel} />
    </section>
  );
};

// ---------- App ----------

const App = () => {
  const [schedule, setSchedule] = useState<CourseSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadSchedule = async () => {
      try {
        const fetchedSchedule = await fetchCourseSchedule(controller.signal);
        setSchedule(fetchedSchedule);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to load the course schedule. Please try again.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadSchedule();

    return () => controller.abort();
  }, [retryCount]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  };

  const editMatch = currentPath.match(/^\/courses\/([^/]+)\/edit\/?$/);
  let editCourseId: string | undefined;

  if (editMatch) {
    try {
      editCourseId = decodeURIComponent(editMatch[1]);
    } catch {
      editCourseId = undefined;
    }
  }

  const isEditingCourse = editMatch !== null;
  const editCourse = schedule?.courses.find(
    (course) => course.id === editCourseId,
  );

  return (
    <main>
      <h1>{schedule?.title ?? 'Computer Science Courses'}</h1>

      {isLoading && (
        <p role="status" className="font-sans text-gray-700">
          Loading course schedule...
        </p>
      )}

      {error && (
        <div className="font-sans text-red-700">
          <p role="alert">Unable to load the course schedule: {error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 rounded-md border border-red-700 px-4 py-2 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {schedule && !isLoading && !error && (
        <>
          <div hidden={isEditingCourse}>
            <TermPage
              courses={schedule.courses}
              onEdit={(courseId) =>
                navigate(`/courses/${encodeURIComponent(courseId)}/edit`)
              }
            />
          </div>
          {isEditingCourse && (
            <CourseEditPage
              key={editCourse?.id ?? 'not-found'}
              course={editCourse}
              onCancel={() => navigate('/')}
            />
          )}
        </>
      )}
    </main>
  );
};

export default App;