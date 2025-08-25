# Next.js 15 Upgrade Guide

## Quick Start
```bash
npm i next@latest react@latest react-dom@latest eslint-config-next@latest
npx @next/codemod@canary upgrade latest
```

## Breaking Changes

### Async Request APIs
These APIs are now asynchronous and require `await`:
- `cookies()`
- `headers()`
- `draftMode()`
- `params` and `searchParams`

```js
// Before
const cookieStore = cookies()
const headersList = headers()

// After
const cookieStore = await cookies()
const headersList = await headers()
```

### Caching Changes
- `fetch` requests are no longer cached by default
- Route Handlers' `GET` methods are not cached by default
- Client-side router cache behavior changed

### Font Imports
```js
// Before
import { Inter } from '@next/font/google'

// After
import { Inter } from 'next/font/google'
```

## Requirements
- Minimum React version: 19
- Node.js support updated

## Migration Steps
1. Run the upgrade codemod
2. Update async API calls to use `await`
3. Explicitly opt into caching where needed
4. Update font imports
5. Test thoroughly

## Benefits
- React 19 feature support
- Improved type safety
- Better caching control
- Enhanced performance