// Después de cada test de componentes se desmonta lo que quedó en el DOM.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
