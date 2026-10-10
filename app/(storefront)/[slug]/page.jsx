import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import config from '@/payload.config'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

async function findPage(slug) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    overrideAccess: false,
  })
  return result.docs[0]
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = await findPage(slug)
  if (!page) return { title: 'Page not found | Ginny Nana' }
  return {
    title: page.seoTitle || `${page.title} | Ginny Nana`,
    description: page.seoDescription || undefined,
  }
}

export default async function ContentPage({ params }) {
  const { slug } = await params
  const page = await findPage(slug)
  if (!page) notFound()

  return (
    <main className="min-h-screen bg-[#fffdfa] text-[#302522]">
      <Navbar />
      <article className="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-[#9a756d]">Ginny Nana</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-3 mb-10">{page.title}</h1>
        {page.body ? (
          <div className="text-[#554944] leading-7 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-[#302522] [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-medium [&_h3]:text-[#302522] [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[#d8c9c1] [&_blockquote]:pl-4 [&_blockquote]:text-[#786963] [&_table]:w-full [&_table]:my-6 [&_td]:border [&_td]:border-[#e8ded8] [&_td]:p-2 [&_th]:border [&_th]:border-[#e8ded8] [&_th]:p-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.body}</ReactMarkdown>
          </div>
        ) : null}
      </article>
      <Footer />
    </main>
  )
}
