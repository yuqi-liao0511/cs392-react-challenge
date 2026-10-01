//import './App.css';

interface Course {
  term: string;
  number: string;
  meets: string;
  title: string;
}

interface Schedule {
  title: string;
  courses: Record<string, Course>;
}

const schedule: Schedule = {
  title: 'CS Courses for 2018-2019',
  courses: {
    F101: {
      term: 'Fall',
      number: '101',
      meets: 'MWF 11:00-11:50',
      title: 'Computer Science: Concepts, Philosophy, and Connections',
    },
    F110: {
      term: 'Fall',
      number: '110',
      meets: 'MWF 10:00-10:50',
      title: 'Intro Programming for non-majors',
    },
    S313: {
      term: 'Spring',
      number: '313',
      meets: 'TuTh 15:30-16:50',
      title: 'Tangible Interaction Design and Learning',
    },
    S314: {
      term: 'Spring',
      number: '314',
      meets: 'TuTh 9:30-10:50',
      title: 'Tech & Human Interaction',
    },
  },
};

const App = () => (
  <main>
    <h1>{schedule.title}</h1>

    <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] items-stretch gap-3">
      {Object.keys(schedule.courses).map((courseKey) => {
        const course = schedule.courses[courseKey];

        return (
          <li className="min-w-0" key={courseKey}>
            <article className="flex h-full flex-col rounded-lg border border-gray-300 bg-white p-4 font-sans text-gray-900 shadow-sm">
              <h2 className="mb-3 text-xl font-medium leading-snug">
                <span className="text-blue-700">{course.term}</span> CS{' '}
                {course.number}
              </h2>

              <p className="mb-4 text-base leading-relaxed text-gray-700">
                {course.title}
              </p>

              <div className="mt-auto border-t border-gray-200 pt-3 text-[0.9375rem] text-gray-700">
                {course.meets}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  </main>
);

export default App;