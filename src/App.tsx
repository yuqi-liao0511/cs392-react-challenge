//import './App.css';

import { useEffect, useState } from 'react';
import {
  fetchCourseSchedule,
  type CourseSchedule,
} from './services/scheduleService';

const App = () => {
  const [schedule, setSchedule] = useState<CourseSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

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
          <p role="alert">
            Unable to load the course schedule: {error}
          </p>
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
          {schedule.courses.length === 0 ? (
            <p className="font-sans text-gray-700">
              No courses are currently available.
            </p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] items-stretch gap-3">
              {schedule.courses.map((course) => (
                <li className="min-w-0" key={course.id}>
                  <article className="flex h-full flex-col rounded-lg border border-gray-300 bg-white p-4 font-sans text-gray-900 shadow-sm">
                    <h2 className="mb-3 text-xl font-medium leading-snug">
                      <span className="text-blue-700">{course.term}</span>{' '}
                      CS {course.number}
                    </h2>

                    <p className="mb-4 text-base leading-relaxed text-gray-700">
                      {course.title}
                    </p>

                    <div className="mt-auto border-t border-gray-200 pt-3 text-[0.9375rem] text-gray-700">
                      {course.meets}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
};

export default App;