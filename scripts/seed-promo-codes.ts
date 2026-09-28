// One-time migration: copies the promo codes that used to be hardcoded in the
// registration routes into Sanity, so staff can manage them from the studio.
//
//   npm run promo:seed
//
// Safe to re-run — existing codes are left untouched rather than overwritten.
// Requires SANITY_API_TOKEN with write access.

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ypbczt01',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

// 99DEVELOPER is deliberately excluded — see the note printed at the end.
const LEGACY_CODES = [
  { code: '605KINGDOMBUILDERS', discountPercent: 50, description: 'East Gate Jax Kingdom Builders 50% Discount' },
  { code: 'EGBUILD605', discountPercent: 50, description: 'East Gate Build 605 50% Discount' },
  { code: '50PERCENT605', discountPercent: 50, description: '50% Discount' },
]

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required to write promo codes.')
    process.exit(1)
  }

  const existing: { code: string }[] = await client.fetch('*[_type == "promoCode"]{code}')
  const existingCodes = new Set(existing.map((p) => p.code?.toUpperCase()))

  for (const entry of LEGACY_CODES) {
    if (existingCodes.has(entry.code)) {
      console.log(`- ${entry.code} already exists, skipping`)
      continue
    }

    await client.create({
      _type: 'promoCode',
      code: entry.code,
      description: entry.description,
      discountPercent: entry.discountPercent,
      active: true,
    })
    console.log(`✅ created ${entry.code} (${entry.discountPercent}% off)`)
  }

  console.log('\nDone. 99DEVELOPER was NOT migrated — it was a 99%-off testing')
  console.log('code live in production. Recreate it in the studio with a')
  console.log('"Valid Until" date if you still need it.')
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
