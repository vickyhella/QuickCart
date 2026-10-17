type Relation = string | number | { id?: string | number } | null | undefined
type MediaRecord = { id: string | number; filename?: string | null; sourceOriginal?: Relation; product?: Relation; url?: string | null }
type ProductRecord = { id: string | number; title?: string | null; featuredImage?: Relation; gallery?: Relation[]; variants?: { image?: Relation }[] }
type PinRecord = { id: string | number; title?: string | null; imageMedia?: Relation; imageURL?: string | null }

const relationID = (value: Relation) => String(value && typeof value === 'object' ? value.id ?? '' : value ?? '')

function getReferences(media: MediaRecord[], products: ProductRecord[], pins: PinRecord[]) {
  const productsByMedia = new Map<string, Set<string>>()
  const pinsByMedia = new Map<string, Set<string>>()
  const productNames = new Map(products.map((product) => [String(product.id), product.title || String(product.id)]))
  const pinNames = new Map(pins.map((pin) => [String(pin.id), pin.title || String(pin.id)]))
  const mediaByURL = new Map(media.filter((item) => item.url).map((item) => [String(item.url), String(item.id)]))

  const add = (map: Map<string, Set<string>>, mediaID: string, ownerID: string) => {
    if (!mediaID) return
    const owners = map.get(mediaID) || new Set<string>()
    owners.add(ownerID)
    map.set(mediaID, owners)
  }

  for (const product of products) {
    const mediaIDs = [product.featuredImage, ...(product.gallery || []), ...(product.variants || []).map((variant) => variant.image)]
      .map(relationID).filter(Boolean)
    for (const mediaID of new Set(mediaIDs)) add(productsByMedia, mediaID, String(product.id))
  }

  for (const pin of pins) {
    add(pinsByMedia, relationID(pin.imageMedia), String(pin.id))
    add(pinsByMedia, mediaByURL.get(String(pin.imageURL || '')) || '', String(pin.id))
  }

  return { productsByMedia, pinsByMedia, productNames, pinNames }
}

export function getMediaUsage(media: MediaRecord[], products: ProductRecord[], pins: PinRecord[]) {
  const { productsByMedia, pinsByMedia, productNames, pinNames } = getReferences(media, products, pins)
  return media.map((item) => {
    const productIDs = [...(productsByMedia.get(String(item.id)) || [])]
    const pinIDs = [...(pinsByMedia.get(String(item.id)) || [])]
    return {
      id: item.id,
      filename: item.filename || String(item.id),
      referenced: Boolean(productIDs.length || pinIDs.length),
      products: productIDs.map((id) => productNames.get(id) || id),
      pins: pinIDs.map((id) => pinNames.get(id) || id),
    }
  })
}

export function getOriginalUsage(originals: { id: string | number; filename?: string | null }[], media: MediaRecord[], products: ProductRecord[], pins: PinRecord[]) {
  const { productsByMedia, pinsByMedia, productNames, pinNames } = getReferences(media, products, pins)

  const linkedMedia = new Map<string, MediaRecord[]>()
  for (const item of media) {
    const originalID = relationID(item.sourceOriginal)
    if (!originalID) continue
    const linked = linkedMedia.get(originalID) || []
    linked.push(item)
    linkedMedia.set(originalID, linked)
  }

  return originals.map((original) => {
    const linked = linkedMedia.get(String(original.id)) || []
    const productIDs = new Set(linked.flatMap((item) => [...(productsByMedia.get(String(item.id)) || [])]))
    const pinIDs = new Set(linked.flatMap((item) => [...(pinsByMedia.get(String(item.id)) || [])]))
    return {
      id: original.id,
      filename: original.filename || String(original.id),
      webpCount: linked.length,
      productCount: productIDs.size,
      pinCount: pinIDs.size,
      products: [...productIDs].map((id) => productNames.get(id) || id),
      pins: [...pinIDs].map((id) => pinNames.get(id) || id),
      referenced: productIDs.size > 0 || pinIDs.size > 0,
    }
  })
}
