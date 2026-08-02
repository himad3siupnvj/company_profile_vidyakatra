import { rename, mkdir, stat, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"

const outTmp = path.join(tmpdir(), "cms-assets-tmp")
await mkdir(outTmp, { recursive: true })

async function optimize(input, output, builder) {
  const tmp = path.join(outTmp, path.basename(input))
  await builder().toFile(tmp)
  await rename(tmp, output)
  console.log(`optimized ${input} -> ${output}`)
}

// Home hero LCP image: 5184x3456 (7MB) -> 1920w JPEG q80
await optimize(
  "assets/kabinet.jpg",
  "assets/kabinet.jpg",
  () =>
    sharp("assets/kabinet.jpg")
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true }),
)

// Cabinet leader photos: 1080x1440 JPEG -> q85
await optimize(
  "assets/lead/sakha-ketum1.jpg",
  "assets/lead/sakha-ketum1.jpg",
  () => sharp("assets/lead/sakha-ketum1.jpg").jpeg({ quality: 85, mozjpeg: true }),
)
await optimize(
  "assets/lead/latanza-waketum.jpg",
  "assets/lead/latanza-waketum.jpg",
  () => sharp("assets/lead/latanza-waketum.jpg").jpeg({ quality: 85, mozjpeg: true }),
)

// Logos (PNG): lossless re-compress; keep the original if the result is not smaller.
// These are imported statically and served through next/image, so shrinking the
// source reduces build output and first-optimizer latency without any visual change.
// Logos (PNG): quantize + re-compress, but only accept the result when it saves
// at least 10% — otherwise the lossy palette pass risks visual banding for no gain.
async function optimizePngIfSmaller(input) {
  const before = (await stat(input)).size
  const tmp = path.join(outTmp, `${path.basename(input)}.opt.png`)
  await sharp(input)
    .png({ compressionLevel: 9, effort: 10, palette: true, colors: 256, dither: 0.75 })
    .toFile(tmp)
  const after = (await stat(tmp)).size
  const saving = 1 - after / before
  if (saving >= 0.1) {
    await rename(tmp, input)
    console.log(`optimized ${input} (${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB)`)
  } else {
    await rm(tmp, { force: true })
    console.log(`skipped ${input} (${Math.round(saving * 100)}% < 10%)`)
  }
}

const pngInputs = [
  "assets/hima.png",
  "assets/logoKabinet.png",
  "assets/organ/ekraf.png",
  "assets/organ/humsiwa.png",
  "assets/organ/koor dept.png",
  "assets/organ/medkom.png",
  "assets/organ/pendidikan.png",
  "assets/organ/psdm.png",
  "assets/organ/sekben.png",
  "assets/organ/sospol.png",
]

for (const input of pngInputs) {
  await optimizePngIfSmaller(input)
}
