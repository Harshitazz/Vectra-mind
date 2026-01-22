# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root of the `Vectra-mind` directory with the following:

```env
NEXT_PUBLIC_API_URL=https://news-ai-394571818909.us-central1.run.app
```

## Setup Instructions

1. Create `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```

2. Add the API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://news-ai-394571818909.us-central1.run.app
   ```

3. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

## For Production (Vercel/Other Platforms)

Add the environment variable in your deployment platform:
- **Vercel**: Settings → Environment Variables → Add `NEXT_PUBLIC_API_URL`
- **Other platforms**: Add `NEXT_PUBLIC_API_URL` to your environment variables

## Note

- The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser
- `.env.local` is gitignored and won't be committed to the repository
- If `NEXT_PUBLIC_API_URL` is not set, it will fallback to the default URL
