# Zustand Stores

This directory contains all Zustand stores for state management in QURABIA.

## Stores

### 1. `quantum-store.ts`
Manages quantum simulation state including:
- Simulation status and progress
- Active qubits configuration
- Results and error handling
- Simulation control (start/stop)

### 2. `ui-store.ts`
Manages UI state including:
- Theme (dark/light)
- Language (ar/en)
- Sidebar state
- Modal management
- Toast notifications
- Loading states

### 3. `auth-store.ts`
Manages authentication state including:
- User information
- JWT token management
- Login/register/logout
- OAuth (Google)
- Token expiration checking

### 4. `settings-store.ts`
Manages application settings including:
- Visualization preferences
- Quantum simulation settings
- Performance settings
- Accessibility options
- Notification preferences

## Usage

### Import from index

```typescript
import {
  useQuantumStore,
  useUIStore,
  useAuthStore,
  useSettingsStore,
  // Or use optimized selectors
  useQuantumStatus,
  useTheme,
  useUser,
  // Or use actions
  useQuantumActions,
  useUIActions,
  useAuthActions,
  useSettingsActions
} from '@/stores';
```

### Example

```typescript
function MyComponent() {
  // Use optimized selectors (recommended)
  const status = useQuantumStatus();
  const theme = useTheme();

  // Use actions
  const { setStatus } = useQuantumActions();
  const { toggleTheme } = useUIActions();

  return <div>...</div>;
}
```

## Features

- **TypeScript**: Full type safety
- **Persistence**: Automatic localStorage persistence for important data
- **DevTools**: Redux DevTools integration (dev only)
- **Selectors**: Optimized selectors to prevent unnecessary re-renders
- **Backward Compatible**: Old hooks still work via wrapper

## Documentation

See `/docs/state-management.md` for full documentation.

## Testing

Tests are located in `/__tests__/stores/`:
- `quantum-store.test.ts`
- `ui-store.test.ts`
- `settings-store.test.ts`

Run tests:
```bash
npm test
```
