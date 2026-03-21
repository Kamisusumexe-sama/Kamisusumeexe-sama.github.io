# Portfolio
My Portifolio

## Netlify Admin Saving Setup

This project now supports saving admin changes directly to your live Netlify site.

### 1) Install dependency

Run:

`npm install`

### 2) Add Netlify environment variable

In Netlify dashboard for this site, add:

- `ADMIN_API_KEY` = a long secret string you create

### 3) Deploy

Deploy with Netlify so the function at `/.netlify/functions/portfolio-data` is active.

### 4) Use Admin page

- Go to `pages/admin.html`
- Make your edits
- Open **Settings**
- Paste the same API key into **Admin API Key**
- Click **[ SAVE TO NETLIFY ]**

The homepage now fetches from Netlify first, so published admin changes appear on the website.
