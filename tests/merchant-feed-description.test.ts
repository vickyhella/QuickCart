import test from 'node:test'
import assert from 'node:assert/strict'
import { merchantDescription } from '../lib/merchant-feed-description.js'

test('converts common product Markdown to compact safe HTML', () => {
  assert.equal(
    merchantDescription('# Hand-finished\n\nMade **by hand** with [reusable](https://example.com) tips.\n\n- Glue included\n- Ready in minutes'),
    '<div><strong>Hand-finished</strong></div><div>Made <strong>by hand</strong> with reusable tips.</div><div>• Glue included<br>• Ready in minutes</div>',
  )
})

test('escapes raw HTML and safely removes Markdown link destinations', () => {
  assert.equal(
    merchantDescription('<script>alert("nails")</script> [shop](javascript:alert(1))'),
    '<div>&lt;script&gt;alert(&quot;nails&quot;)&lt;/script&gt; shop</div>',
  )
})

test('keeps XML CDATA terminators safe', () => {
  assert.equal(merchantDescription(']]>'), '<div>]]&gt;</div>')
})
