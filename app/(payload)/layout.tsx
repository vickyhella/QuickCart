import type { ServerFunctionClient } from 'payload'
import '@payloadcms/next/css'
import './studio-utilities.css'
import './brand-theme'
import config from '@payload-config'
import {
  handleServerFunctions,
  metadata as payloadMetadata,
  RootLayout,
} from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'

export const metadata = {
  ...payloadMetadata,
}

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
