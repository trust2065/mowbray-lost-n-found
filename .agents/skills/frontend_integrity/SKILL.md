---
name: frontend_integrity
description: Ensures React/TypeScript code integrity by verifying type safety and hook dependencies during modifications.
---

# Frontend Integrity Skill

## Overview
This skill establishes a mandatory workflow for modifying frontend components to prevent broken builds and runtime issues related to stale tests or unstable React hooks.

## Rules to Follow

### 1. Atomic Component Updates
When a component's `interface Props` or internal logic is modified:
- **Search and Update Tests**: Immediately search for the component's test file (usually in `__tests__` or same directory) and update the mock props to match the new interface.
- **Search and Update Usage**: Check parent components in `src/App.tsx` or other containers to ensure they passed the required new props.

### 2. React Hook Stability (The Dependency Rule)
Strictly follow the `react-hooks/exhaustive-deps` rule to avoid stale closures and infinite re-renders:
- **Dependency Completeness**: All variables and functions from the component scope used inside `useEffect`, `useMemo`, or `useCallback` MUST be in the dependency array.
- **Function Stability**:
    - If a function is used inside a `useEffect`, either define it INSIDE the effect or wrap it in `useCallback`.
    - Always verify if the dependencies of `useCallback` are stable.
- **Closure Awareness**: Ensure `useEffect` cleanup functions are provided if manual listeners (like `window.addEventListener`) are attached.

### 3. Verification Commands
Before declaring a task finished, run these checks:
- **Type Check**: `npx tsc --noEmit` (or specific file check if global check is slow/failed)
- **Lint Check**: `npx eslint <modified_files>`
- **Test Check**: `npm test <modified_test_file>`

## Failure Recovery
If `npm run build` fails due to environment issues (e.g., `EPERM` on `node_modules`), do not ignore the potential logic errors. Use granular `tsc` checks on specific files to ensure code is sound:
`npx tsc src/components/PathToComponent.tsx --noEmit --esModuleInterop --jsx react-jsx`
