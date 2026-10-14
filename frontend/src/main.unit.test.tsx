import ReactDOM from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const renderSpy = vi.hoisted(() => vi.fn());
vi.mock('./styles/index.scss', () => ({}));
vi.mock('./App', () => ({ default: () => <div>app</div> }));
vi.mock('react-dom/client', () => ({
  default: { createRoot: vi.fn(() => ({ render: renderSpy, unmount: vi.fn() })) },
}));
describe('main bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });
  it('renders the app into the root', async () => {
    vi.resetModules();
    await import('./main');
    expect(ReactDOM.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(renderSpy).toHaveBeenCalledOnce();
  });
});
