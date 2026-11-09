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
    expect(nonConflictingCourse).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Course plan' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Fall CS 213: Introduction to Computing',
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
