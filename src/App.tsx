import { useEffect, useState } from 'react';
import {
  fetchCourseSchedule,
  type CourseSchedule,
  type CourseTerm,
} from './services/scheduleService';

const terms: CourseTerm[] = ['Fall', 'Winter', 'Spring'];

const App = () => {
  const [schedule, setSchedule] = useState<CourseSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<CourseTerm>('Fall');
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (nextSelection.has(courseId)) {
        nextSelection.delete(courseId);
      } else {
        nextSelection.add(courseId);
      }

      return nextSelection;
    });
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
  }, []);

  return (
    <main>
      <h1>{schedule?.title ?? 'Computer Science Courses'}</h1>
      {isLoading && (
        <p role="status" className="font-sans text-gray-700">
          Loading course schedule...
        </p>
      )}
      {error && (
        <p role="alert" className="font-sans text-red-700">
          Unable to load the course schedule: {error}
        </p>
      )}
      {schedule && (
        <>
          <div
            aria-label="Select academic term"
            className="mb-4 flex flex-wrap gap-2 font-sans"
            role="group"
          >
            {terms.map((term) => {
              const isSelected = selectedTerm === term;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                    isSelected
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  key={term}
                  onClick={() => setSelectedTerm(term)}
                  type="button"
                >
                  {term}
                </button>
              );
            })}
          </div>
          <section aria-labelledby="selected-classes-heading" className="mb-6 font-sans">
            <h2
              className="mb-2 text-lg font-semibold text-gray-900"
              id="selected-classes-heading"
            >
              Selected classes
            </h2>
            {selectedCourseIds.size > 0 ? (
              <ul className="space-y-1 text-sm text-gray-700">
                {schedule.courses
                  .filter((course) => selectedCourseIds.has(course.id))
                  .map((course) => (
                    <li key={course.id}>
                      {course.term} CS {course.number}: {course.title}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                Click a course card to add it to your selected classes.
              </p>
            )}
          </section>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] items-stretch gap-3">
            {schedule.courses
              .filter((course) => course.term === selectedTerm)
              .map((course) => {
                const isSelected = selectedCourseIds.has(course.id);

                return (
                  <li className="min-w-0" key={course.id}>
                    <button
                      aria-pressed={isSelected}
                      className={`flex h-full w-full flex-col rounded-lg border p-4 text-left font-sans shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-gray-900'
                          : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleCourseSelection(course.id)}
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
                      </span>
                      <span className="mb-4 block text-base leading-relaxed text-gray-700">
                        {course.title}
                      </span>
                      <span className="mt-auto block w-full border-t border-gray-200 pt-3 text-[0.9375rem] text-gray-700">
                        {course.meets}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </main>
  );
};

export default App;
