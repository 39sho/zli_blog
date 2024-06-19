interface Env {
  ASSETS: Fetcher
}

type BlogInfo = {
  dirName: string
  title: string
  tags: string[]
  authorId: string
}

type Info = {
  dirName: string
  title: string
  description: string
}

const isAsset = (pathname: string): boolean => pathname.includes('.')

export const onRequest: PagesFunction<Env> = async (context) => {
  const pathname = new URL(context.request.url).pathname

  if (isAsset(pathname)) return context.next()

  const dirName = pathname.match(/^\/blog\/([^\/]+)/)?.[1]

  const info: Info = {
    dirName: '',
    title: 'Zli Blog',
    description: '会津大学公認サークルZliのブログです',
  }

  if (dirName != null) {
    info.dirName = dirName

    const blogListRes = await context.env.ASSETS.fetch(
      new URL('/articles/list.json', context.request.url)
    )
    const blogInfoList = (await blogListRes.json()) as { articles: BlogInfo[] }

    info.title =
      blogInfoList.articles.find((e) => e.dirName === dirName)?.title +
        ' | Zli Blog' ?? info.title

    const blogRes = await context.env.ASSETS.fetch(
      new URL(`/articles/${dirName}/index.md`, context.request.url)
    )
    const md = (await blogRes.text()).replace(/---[^-]*---/, '')

    info.description = md.slice(0, 200)
  }

  console.log(info)

  return new HTMLRewriter()
    .on('head', {
      element: (e) => {
        e.append(
          `<meta charset="UTF-8" />
            <link rel="icon" type="image/ico" href="/favicon.ico" />
            <meta property="og:url" content="https://zli.work/blog/${info.dirName}" />
            <meta property="og:type" content="blog" />
            <meta property="og:title" content="${info.title}" />
            <meta property="og:description" content="${info.description}" />
            <meta property="og:site_name" content="${info.title}" />
            <meta property="og:image" content="https://zli.works/ogp.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="${info.description}" />
            <title>${info.title}</title>`,
          { html: true }
        )
      },
    })
    .transform(await context.env.ASSETS.fetch(context.request))
}
