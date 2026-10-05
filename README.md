# Konsultime frontend

Vite + React + TypeScript, për Vercel dhe instalim si PWA.

```sh
npm install
npm run dev
npm run build
```

`VITE_API_URL` është `https://api.konsultime.mk` si parazgjedhje. Në Vercel: Framework = Vite, Build Command = `npm run build`, Output Directory = `dist`. Lidh `konsultime.mk` me Vercel. API duhet të ketë CORS për atë domain dhe certifikatë HTTPS. PWA ruan shell-in e aplikacionit, kurse të dhënat e klientëve merren gjithmonë nga API.
