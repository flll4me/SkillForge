import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startActivityTracking } from './activity.js';

const fetchMock = vi.fn();
let stop: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', fetchMock.mockResolvedValue({ status: 204 }));
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
});
afterEach(() => { stop?.(); stop = undefined; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const samples = () => fetchMock.mock.calls.map((call) => JSON.parse(call[1].body));

describe('active visit measurement', () => {
  it('registers a visit and sends cumulative seconds without tracking hidden time', async () => {
    stop = startActivityTracking('user-token');
    await vi.advanceTimersByTimeAsync(45000);
    expect(samples().map((sample) => sample.activeSeconds)).toEqual([0, 15, 30]);
    expect(new Set(samples().map((sample) => sample.sessionId)).size).toBe(1);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    const callsBefore = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchMock).toHaveBeenCalledTimes(callsBefore);
  });

  it('stops measuring after inactivity and resumes on interaction', async () => {
    stop = startActivityTracking('user-token');
    await vi.advanceTimersByTimeAsync(180000);
    const before = samples().at(-1).activeSeconds;
    await vi.advanceTimersByTimeAsync(60000);
    expect(samples().at(-1).activeSeconds).toBe(before);
    window.dispatchEvent(new Event('pointerdown'));
    await vi.advanceTimersByTimeAsync(15000);
    expect(samples().at(-1).activeSeconds).toBe(before + 15);
  });

  it('removes the timer and listeners when the user signs out', async () => {
    stop = startActivityTracking('user-token');
    await vi.advanceTimersByTimeAsync(30000);
    stop(); stop = undefined;
    const count = fetchMock.mock.calls.length;
    window.dispatchEvent(new Event('pointerdown'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchMock).toHaveBeenCalledTimes(count);
  });
});
