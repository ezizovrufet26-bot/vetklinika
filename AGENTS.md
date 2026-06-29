<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VetKlinika Operation & Architecture Notes

## WhatsApp Integration (Baileys Gateway)
- **Gateway Script**: `whatsapp-gateway.mjs` running on port `3001`.
- **Webhook Endpoint**: `http://localhost:3000/api/whatsapp/webhook`.
- **Database Connection**: Uses Supabase pooler on port `6543` (IPv4).
- **Prisma Note**: If `schema.prisma` is modified, always run `npx prisma generate` and restart the Next.js server so updated typings are available.
