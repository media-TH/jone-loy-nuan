# Edge Function: issue-anon-jwt

App เรียก function นี้เพื่อขอ anon JWT + anon_user_id สำหรับ quiz flow

## Deploy (ต้องติดตั้ง Supabase CLI ก่อน)

```bash
# ติดตั้ง CLI (ถ้ายังไม่มี): https://supabase.com/docs/guides/cli
# Windows: scoop install supabase หรือ npm i -g supabase

# Login (ครั้งแรก)
supabase login

# Link โปรเจกต์ (ครั้งแรก, ถ้ายังไม่ link)
supabase link --project-ref tbyjrjdmxujwqvdgqdxp

# Deploy (ไม่ต้อง verify JWT เพราะ client ยังไม่มี token ตอนขอครั้งแรก)
supabase functions deploy issue-anon-jwt --no-verify-jwt --project-ref tbyjrjdmxujwqvdgqdxp
```

## Env (ตั้งใน Dashboard → Edge Functions → issue-anon-jwt → Settings)

- **SECRET_KEY** หรือ **ANON_JWT_SECRET** — ต้องเป็น **Project JWT Secret** (Dashboard → API → JWT Secret) ถึงจะให้ RLS ใช้ `auth.jwt()` ได้
- **SUPABASE_SERVICE_ROLE_KEY** — ใช้เป็น fallback ได้ แต่ RLS อาจไม่เห็น JWT
- **TOKEN_TTL_SECONDS** (optional, default 86400 = 1 วัน)

## หลัง deploy

URL จะเป็น: `https://tbyjrjdmxujwqvdgqdxp.supabase.co/functions/v2/issue-anon-jwt`  
App เรียก URL นี้อยู่แล้ว (จาก NEXT_PUBLIC_SUPABASE_URL) ไม่ต้องแก้ env
