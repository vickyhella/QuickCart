import type { ServerFunctionClient } from 'payload'
import '@payloadcms/next/css'
import './studio-utilities.css'
import './brand-theme'
import config from '@payload-config'
import {
  handleServerFunctions,
  metadata,
  RootLayout,
} from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'

export { metadata }

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
