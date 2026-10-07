import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './PracticeApp.js';
import { getInterviewQuestions } from './api/interviews.js';

vi.mock('./api/interviews.js', () => ({
  getInterviewQuestions: vi.fn(),
}));

describe('SkillForge API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows questions returned by the API when an interview starts', async () => {
    getInterviewQuestions.mockResolvedValue({
      track: 'Frontend',
      level: 'Junior',
      questions: [{ topic: 'API topic', prompt: 'Question returned by the API' }],
    });
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector('.interview-setup__submit'));

    expect(await screen.findByRole('heading', { name: 'Question returned by the API' }))
      .toBeInTheDocument();
    expect(getInterviewQuestions).toHaveBeenCalledWith('Frontend', 'Junior');
  });

  it('shows a recoverable error when questions cannot be loaded', async () => {
    getInterviewQuestions.mockRejectedValue(new Error('network unavailable'));
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector('.interview-setup__submit'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(container.querySelector('.interview-setup__submit')).toBeEnabled();
  });
});
