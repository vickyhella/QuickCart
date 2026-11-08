import fs from 'node:fs/promises'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

// Edit captions/layout below; replace photo sheets under public/site/guides/photos/.
const root = fileURLToPath(new URL('../public/site/guides/', import.meta.url))
const images = {}
for (const name of ['application', 'measurement']) {
  const jpg = await fs.readFile(`${root}/photos/${name}.jpg`)
  const meta = await sharp(jpg).metadata()
  images[name] = { data: `data:image/jpeg;base64,${jpg.toString('base64')}`, width: meta.width, height: meta.height }
}

const text = (x, y, value, size, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${value}</text>`
const start = (height, title, desc, image) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1120 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${title}</title><desc id="desc">${desc}</desc>
<!-- Text and layout are editable vectors. The embedded photo sheet is a replaceable raster layer. -->
<defs><image id="photo-sheet" width="${image.width}" height="${image.height}" xlink:href="${image.data}"/></defs>
<rect width="1120" height="${height}" fill="#fffdfa"/>
<g font-family="Arial, sans-serif" fill="#473545">
${text(1060, 53, 'Ginny Nana', 25, 'font-family="Georgia, serif" text-anchor="end" fill="#704576"')}`
const photo = (x, y, width, height, vx, vy, vw, vh) => `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><use xlink:href="#photo-sheet"/></svg>`

const a = images.application
let apply = start(1200, 'How to apply press-on nails', 'Four photographic examples: cleaning a natural nail, dry-fitting a press-on, adding adhesive, and pressing into place.', a)
apply += text(60, 110, 'How to apply', 70, 'font-family="Georgia, serif" fill="#392637"')
apply += text(62, 151, 'A few simple steps for a beautiful fit.', 27, 'fill="#786578"')
apply += '<path d="M60 176H1060" stroke="#dfd1df"/>'
const steps = [
  { x:60, y:204, vx:0, vy:0, title:'1. Prep', caption:'Clean, lightly buff and wipe dry.' },
  { x:580, y:204, vx:a.width/2, vy:0, title:'2. Find your fit', caption:'Try each tip before using adhesive.' },
  { x:60, y:664, vx:0, vy:a.height/2, title:'3. Add adhesive', caption:'Choose jelly tabs or nail glue.' },
  { x:580, y:664, vx:a.width/2, vy:a.height/2, title:'4. Place &amp; press', caption:'Align at the cuticle. Press firmly.' },
]
for (const s of steps) {
  apply += `<g id="step-${steps.indexOf(s)+1}">`
  apply += photo(s.x,s.y,480,320,s.vx,s.vy,a.width/2,a.height/2)
  apply += text(s.x,s.y+369,s.title,37,'font-family="Georgia, serif" fill="#704576"')
  apply += text(s.x,s.y+408,s.caption,25,'fill="#665766"')
  apply += '</g>'
}
apply += '<path d="M60 1124H1060" stroke="#dfd1df"/>'
apply += text(60,1166,'Follow your adhesive label for hold time, aftercare and removal.',24,'fill="#786578"')
apply += '</g></svg>'
await fs.writeFile(`${root}/how-to-apply.svg`,apply)

const m = images.measurement
let measure = start(1490, 'How to measure nail width', 'Three photographic examples: wrap a narrow paper strip across the widest part of a natural nail, mark both sidewalls, then flatten the strip and measure the marked distance with a millimeter ruler.', m)
measure += text(60,110,'Find your perfect fit',63,'font-family="Georgia, serif" fill="#392637"')
measure += text(62,151,'Measure nail width in millimeters, from sidewall to sidewall.',27,'fill="#786578"')
measure += '<path d="M60 176H1060" stroke="#dfd1df"/>'
const measuringSteps = [
  { y:204, title:'1. Wrap', lines:['Lay a narrow paper strip across','the widest part of your nail.','Let it follow the nail’s curve.'] },
  { y:608, title:'2. Mark', lines:['Mark where the paper meets','each sidewall of your nail.','Keep the strip in the same place.'] },
  { y:1012, title:'3. Measure', lines:['Flatten the strip against a ruler.','Read between the two marks','in millimeters (mm).'] },
]
for (let i=0;i<3;i++) {
  const s = measuringSteps[i]
  measure += `<g id="measurement-step-${i+1}">`
  measure += photo(60,s.y,360,360,i*m.width/3,0,m.width/3,m.height)
  measure += text(476,s.y+110,s.title,48,'font-family="Georgia, serif" fill="#704576"')
  s.lines.forEach((line,index)=>measure += text(476,s.y+170+index*43,line,29,'fill="#665766"'))
  measure += '</g>'
  if (i<2) measure += `<path d="M476 ${s.y+359}H1060" stroke="#e7dfe6"/>`
}
measure += '<path d="M60 1410H1060" stroke="#dfd1df"/>'
measure += text(60,1453,'Measure both hands, then compare with the Ginny Nana size chart.',24,'fill="#786578"')
measure += '</g></svg>'
await fs.writeFile(`${root}/measure-nail-width.svg`,measure)
console.log('Updated how-to-apply.svg and measure-nail-width.svg.')
