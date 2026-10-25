const byRequest = new WeakMap<object, Promise<Record<string, any>>>()

export function getMarketingSettingsForRequest(req: any) {
  let settings = byRequest.get(req)
  if (!settings) {
    settings = req.payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true, req })
    byRequest.set(req, settings)
  }
  return settings!
}

export function setMarketingSettingsForRequest(req: object, settings: Record<string, any>) {
  byRequest.set(req, Promise.resolve(settings))
}
