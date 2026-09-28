import './App.css';

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
    <ul className="course-list">
      {Object.keys(schedule.courses).map((courseKey) => {
        const course = schedule.courses[courseKey];

        return (
          <li key={courseKey}>
            {course.term} CS {course.number}: {course.title} ({course.meets})
          </li>
        );
      })}
    </ul>
  </main>
);

export default App;