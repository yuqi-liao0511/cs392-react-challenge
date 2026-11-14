import '@testing-library/jest-dom/vitest';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useAuth } from './hooks/useAuth';
import { useAdminStatus } from './hooks/useAdminStatus';
import { useDataQuery } from './hooks/useDataQuery';
import { signInWithGoogle, signOutUser } from './services/authService';
import type { CourseSchedule } from './services/scheduleService';
import type { User } from 'firebase/auth';

vi.mock('./hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('./hooks/useAdminStatus', () => ({ useAdminStatus: vi.fn() }));
vi.mock('./hooks/useDataQuery', () => ({ useDataQuery: vi.fn() }));
vi.mock('./services/authService', () => ({
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));
vi.mock('./services/scheduleService', () => ({
  SCHEDULE_PATH: 'schedules/test',
  safeParseSchedule: (payload: unknown) => ({
    schedule: payload as CourseSchedule,
  }),
  updateCourse: vi.fn(),
}));

const schedule: CourseSchedule = {
  title: 'Computer Science Courses',
  courses: [
    {
      id: 'cs213',
      term: 'Fall',
      number: '213',
      title: 'Introduction to Computing',
      meets: 'MWF 10:00-11:00',
    },
    {
      id: 'cs214',
      term: 'Fall',
      number: '214',
      title: 'Data Structures',
      meets: 'MWF 10:30-11:30',
    },
    {
      id: 'cs215',
      term: 'Fall',
      number: '215',
      title: 'Discrete Mathematics',
      meets: 'Tu 10:00-11:00',
    },
  ],
};

const multipleConflictSchedule: CourseSchedule = {
  title: 'Computer Science Courses',
  courses: [
    {
      id: 'cs213',
      term: 'Fall',
      number: '213',
      title: 'Monday Course',
      meets: 'M 10:00-11:00',
    },
    {
      id: 'cs214',
      term: 'Fall',
      number: '214',
      title: 'Tuesday Course',
      meets: 'Tu 10:00-11:00',
    },
    {
      id: 'cs215',
      term: 'Fall',
      number: '215',
      title: 'Monday and Tuesday Course',
      meets: 'MTu 10:30-10:45',
    },
  ],
};

const overloadSchedule: CourseSchedule = {
  title: 'Computer Science Courses',
  courses: [
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `fall${index + 1}`,
      term: 'Fall' as const,
      number: `${301 + index}`,
      title: `Fall Course ${index + 1}`,
      meets: `M ${8 + index}:00-${9 + index}:00`,
    })),
    {
      id: 'winter301',
      term: 'Winter',
      number: '301',
      title: 'Winter Course',
      meets: 'Tu 10:00-11:00',
    },
  ],
};

const signedInUser = {
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
} as User;

const signedOut = { user: null, isAuthenticated: false, isInitialLoading: false };
const signedIn = { user: signedInUser, isAuthenticated: true, isInitialLoading: false };
const checking = { user: null, isAuthenticated: false, isInitialLoading: true };
const adminStatus = { isAdmin: false, isLoading: false, error: undefined };
const admin = { isAdmin: true, isLoading: false, error: undefined };

describe('course schedule app', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(signedOut);
    vi.mocked(useAdminStatus).mockReturnValue(adminStatus);
    vi.mocked(useDataQuery).mockReturnValue([schedule, false, undefined]);
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.clearAllMocks();
  });

  it('lets signed-out users sign in but hides course edit links', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledOnce());
    expect(
      screen.queryByRole('link', { name: 'Edit' }),
    ).not.toBeInTheDocument();
  });

  it('asks signed-out visitors to sign in on a direct edit URL', () => {
    window.history.replaceState({}, '', '/courses/cs213/edit');
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('shows the signed-in name, sign-out control, and edit links', async () => {
    vi.mocked(useAuth).mockReturnValue(signedIn);
    vi.mocked(useAdminStatus).mockReturnValue(admin);
    render(<App />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(signOutUser).toHaveBeenCalledOnce());
    expect(screen.getAllByRole('link', { name: 'Edit' })).toHaveLength(3);
  });

  it('hides edit links from signed-in non-admins', () => {
    vi.mocked(useAuth).mockReturnValue(signedIn);
    render(<App />);

    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('denies direct edit URLs to signed-in non-admins', () => {
    vi.mocked(useAuth).mockReturnValue(signedIn);
    window.history.replaceState({}, '', '/courses/cs213/edit');
    render(<App />);

    expect(
      screen.getByText('Only administrators can edit courses'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Course title')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('waits for the sign-in check before showing sign-in controls or messages', () => {
    vi.mocked(useAuth).mockReturnValue(checking);
    window.history.replaceState({}, '', '/courses/cs213/edit');
    render(<App />);

    expect(screen.getByText('Checking sign-in...')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Sign in required' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('does not show an error when the Google popup is closed', async () => {
    vi.mocked(signInWithGoogle).mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledOnce());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps selection, conflict handling, and the course plan working', () => {
    render(<App />);

    const firstCourse = screen.getByRole('button', { name: /Fall CS 213/ });
    const conflictingCourse = screen.getByRole('button', {
      name: /Fall CS 214/,
    });
    const nonConflictingCourse = screen.getByRole('button', {
      name: /Fall CS 215/,
    });

    fireEvent.click(firstCourse);

    expect(firstCourse).toHaveAttribute('aria-pressed', 'true');
    expect(conflictingCourse).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Conflicts with CS 213');
    expect(firstCourse).not.toHaveTextContent('Conflicts with');
    expect(nonConflictingCourse).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Course plan (1)' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Fall CS 213: Introduction to Computing',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('1 course selected');
    expect(screen.getByRole('dialog')).toHaveTextContent('Fall: 1 course');
  });

  it('shows live total and per-term counts with an overload warning', () => {
    vi.mocked(useDataQuery).mockReturnValue([overloadSchedule, false, undefined]);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Fall CS 301/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 302/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 303/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 304/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 305/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Winter' }));
    fireEvent.click(screen.getByRole('button', { name: /Winter CS 301/ }));

    expect(
      screen.getByRole('button', { name: 'Course plan (6)' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Course plan (6)' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('6 courses selected');
    expect(screen.getByRole('dialog')).toHaveTextContent('Fall: 5 courses');
    expect(screen.getByRole('dialog')).toHaveTextContent('Winter: 1 course');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Fall has 5 courses. Most students take at most 4.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fall' }));
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 305/ }));

    expect(screen.getByRole('button', { name: 'Course plan (5)' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('5 courses selected');
    expect(screen.getByRole('dialog')).toHaveTextContent('Fall: 4 courses');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps the empty course plan message when no courses are selected', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Course plan (0)' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('0 courses selected');
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'No courses selected yet. Close this window and click a course card to add it to your plan.',
    );
    expect(screen.queryByText(/Fall:|Winter:|Spring:/)).not.toBeInTheDocument();
  });

  it('updates conflict messages immediately when selected courses are removed', () => {
    render(<App />);

    const selectedCourse = screen.getByRole('button', { name: /Fall CS 213/ });
    const conflictingCourse = screen.getByRole('button', { name: /Fall CS 214/ });

    fireEvent.click(selectedCourse);
    expect(screen.getByRole('status')).toHaveTextContent('Conflicts with CS 213');

    fireEvent.click(selectedCourse);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(conflictingCourse).toBeEnabled();
  });

  it('names every selected course that conflicts with a blocked course', () => {
    vi.mocked(useDataQuery).mockReturnValue([
      multipleConflictSchedule,
      false,
      undefined,
    ]);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Fall CS 213/ }));
    fireEvent.click(screen.getByRole('button', { name: /Fall CS 214/ }));

    expect(screen.getByRole('button', { name: /Fall CS 215/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Conflicts with CS 213, CS 214',
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('filters the selected term by normalized title or course number and can clear search', () => {
    render(<App />);

    const search = screen.getByRole('searchbox', { name: 'Search courses' });

    fireEvent.change(search, { target: { value: '  DATA    STRUCTURES ' } });
    expect(screen.getByRole('button', { name: /Fall CS 214/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Fall CS 213/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: '213' } });
    expect(screen.getByRole('button', { name: /Fall CS 213/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Fall CS 214/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'xyz' } });
    expect(screen.getByText('No Fall courses match “xyz”.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear course search' }));
    expect(search).toHaveValue('');
    expect(screen.getAllByRole('button', { name: /Fall CS/ })).toHaveLength(3);
  });

  it('keeps selected courses in the plan while they are hidden by search', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Fall CS 213/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search courses' }), {
      target: { value: 'data' },
    });

    expect(screen.queryByRole('button', { name: /Fall CS 213/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Course plan/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Fall CS 213: Introduction to Computing',
    );
  });

  it('shows admin Edit links only for courses that match the search', () => {
    vi.mocked(useAuth).mockReturnValue(signedIn);
    vi.mocked(useAdminStatus).mockReturnValue(admin);
    render(<App />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search courses' }), {
      target: { value: 'data' },
    });

    expect(screen.getAllByRole('link', { name: 'Edit' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/courses/cs214/edit',
    );
  });

  it('keeps edit form validation enabled for signed-in users', async () => {
    vi.mocked(useAuth).mockReturnValue(signedIn);
    vi.mocked(useAdminStatus).mockReturnValue(admin);
    window.history.replaceState({}, '', '/courses/cs213/edit');
    render(<App />);

    const titleInput = screen.getByRole('textbox', { name: 'Course title' });
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'x' } });
    });

    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
