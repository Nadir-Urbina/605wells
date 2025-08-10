'use client'

import dynamic from 'next/dynamic'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

// Import our event schema from the sanity folder
import event from '../../../../sanity/schemaTypes/event'

const NextStudio = dynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  { ssr: false }
)

const config = defineConfig({
  name: 'default',
  title: '605 Wells Ministry Hub',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ypbczt01',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  
  plugins: [structureTool(), visionTool()],
  
  schema: {
    types: [event],
  },
})

export default function StudioWrapper() {
  return <NextStudio config={config} />
}