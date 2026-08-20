# Chopra Boxes

A phone-first packing list for a family moving with 50–60 boxes. The tag is a **Sharpie code**, not a printed label.

Write the same short code on every side of the box (`KIT-12` or a custom one like `SE-357`). Open this app, tap the room (or Custom), tap the number, and see what’s inside.

## Run locally

Work in `/workspace/chopra-boxes`.

1. Install JavaScript dependencies in this folder.
2. Start the Next.js dev server on port 3000.
3. Open http://localhost:3000

Use the `dev`, `build`, and `start` scripts from `package.json`.

On iPhone Safari: Share → **Add to Home Screen**. The app works offline for boxes already cached on that phone.

## Tagging system

Primary tag = Sharpie. One code per box, written large on 4–5 sides.

Format: `{2–3 letters}-{1–3 digits}`. Two-digit numbers stay padded (`KIT-12`, `SE-07`); three-digit numbers stay as written (`SE-357`).

Built-in rooms:

| Prefix | Room     |
|--------|----------|
| KIT    | Kitchen  |
| BED    | Bedroom  |
| KID    | Kids     |
| LIV    | Living   |
| DIN    | Dining   |
| BTH    | Bathroom |
| GAR    | Garage   |
| OFF    | Office   |
| OTH    | Other    |

Custom prefixes (`SE`, `GN`, …) work the same way. Codes auto-increment per prefix and are never reused.

Find a box by room + number, or tap **Read the Sharpie** to photograph the writing.

A single backup print sheet lives at `/print`. Default advice: Sharpie is enough.

## Data

- Phone cache: `localStorage`
- Local server: `data/boxes.json`
- Later (multi-device): set `KV_REST_API_URL` and `KV_REST_API_TOKEN` to use Vercel KV

API: `GET/POST /api/boxes`, `GET/PUT/DELETE /api/boxes/[code]`

Three example boxes ship with the app so the list isn’t empty. Delete them when you start packing.
