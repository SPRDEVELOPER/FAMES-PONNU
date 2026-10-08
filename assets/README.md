# Artwork (anime-girl pictures)

Drop your images in this folder — **no code changes needed**. The bot picks them up automatically.
Any screen without an image is sent as plain text, so the bot also works with this folder empty.

| File name (jpg / jpeg / png) | Shown on |
|---|---|
| `default` | fallback for every screen that has no image of its own |
| `welcome` | /start and main menu |
| `play` | "enter first / second name" screens |
| `help` | how-to-play page |
| `stats` | my stats |
| `leaderboard` | leaderboard |
| `result_F` `result_L` `result_A` `result_M` `result_E` `result_S` | the six result cards |

Example: `assets/welcome.jpg`, `assets/result_L.png`

**Tips**
- Keep each file under ~5 MB. Landscape or square images work best.
- Prefer hosting instead? Set `IMG_WELCOME=https://…`, `IMG_RESULT_L=https://…` etc. in `.env`.
- Use art you drew, commissioned, licensed, or generated yourself. Avoid images of copyrighted
  characters/studios — public bots with such art get reported and removed.
