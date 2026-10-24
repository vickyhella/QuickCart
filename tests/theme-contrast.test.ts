import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const palette = Object.fromEntries([...readFileSync(new URL('../app/theme-tokens.css', import.meta.url), 'utf8').matchAll(/--gn-([\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => [match[1], match[2]]))

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((part) => Number.parseInt(part, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

for (const background of ['white', 'canvas']) {
  test(`form control boundaries remain visible on ${background}`, () => {
    const a = luminance(palette['control-border'])
    const b = luminance(palette[background])
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 3, 'Control boundaries require at least 3:1 contrast')
  })
}

for (const [foreground, background] of [
  ['ink', 'white'], ['ink', 'ivory'], ['ink', 'canvas'], ['ink', 'lavender'],
  ['muted', 'white'], ['muted', 'canvas'], ['muted', 'lavender'], ['muted', 'ivory'],
  ['white', 'plum'], ['white', 'plum-hover'], ['white', 'highlight'], ['white', 'highlight-hover'], ['plum', 'lavender-soft'],
  ['disabled-text', 'disabled-bg'], ['success', 'success-soft'],
  ['danger', 'danger-soft'], ['warning', 'warning-soft'],
]) {
  test(`theme text remains readable: ${foreground} on ${background}`, () => {
    assert.ok(palette[foreground] && palette[background], 'Both semantic colors must exist')
    const values = [luminance(palette[foreground]), luminance(palette[background])].sort((a, b) => b - a)
    const ratio = (values[0] + 0.05) / (values[1] + 0.05)
    assert.ok(ratio >= 4.5, `Contrast ${ratio.toFixed(2)}:1 is below the normal-text minimum 4.5:1`)
  })
}
