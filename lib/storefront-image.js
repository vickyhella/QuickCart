export function normalizeStorefrontImageSource(src) {
  // Payload file URLs can carry a trailing slash; Next's internal image fetch does not follow its redirect.
  return typeof src === 'string' ? src.replace(/^(\/api\/media\/file\/[^?]+)\/(\?.*)?$/, '$1$2') : src
}
