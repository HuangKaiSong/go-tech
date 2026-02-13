import fg from 'fast-glob'
import { readFile } from 'fs/promises'
import { basename, extname, relative, resolve } from 'path'
import SVGCompiler from 'svg-baker'
import { optimize } from 'svgo'
import {
  SVG_DOM_ID,
  SVG_ICONS_CLIENT,
  SVG_ICONS_REGISTER_NAME,
  XMLNS,
  XMLNS_LINK,
} from './constants'

export type DomInject = 'body-first' | 'body-last'

export interface SvgIconsOpt {
  /**
   * icons folder, all svg files in it will be converted to svg sprite.
   */
  iconDirs: string[]

  /**
   * svgo configuration, used to compress svg
   * @default：true
   */
  svgoOptions?: boolean

  /**
   * icon format
   * @default: icon-[dir]-[name]
   */
  symbolId?: string

  /**
   * icon format
   * @default: body-last
   */
  inject?: DomInject

  /**
   * custom dom id
   * @default: __svg__icons__dom__
   */
  customDomId?: string
}

export interface FileStats {
  relativeName: string
  mtimeMs?: number
  code: string
  symbolId?: string
}

export interface SvgSpriteResult {
  html: string
  symbolIds: string[]
}

type HtmlTransformResult = string | { html: string; tags: unknown[] }

interface ViteLikePlugin {
  name: string
  enforce?: 'pre' | 'post'
  configResolved?: (config: { command?: string }) => void
  buildStart?: () => Promise<void> | void
  resolveId?: (id: string) => string | null | void
  load?: (id: string) => Promise<string | null> | string | null
  transformIndexHtml?: (html: string) => HtmlTransformResult | Promise<HtmlTransformResult>
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/')
}

function createSymbolIdByPattern(symbolIdPattern: string, filePath: string, iconDir: string) {
  const relPath = normalizePath(relative(iconDir, filePath))
  const ext = extname(relPath)
  const dir = relPath.includes('/') ? relPath.slice(0, relPath.lastIndexOf('/')) : ''
  const name = basename(relPath, ext)
  return symbolIdPattern
    .replace(/\[dir\]/g, dir ? dir.replace(/\//g, '-') : '')
    .replace(/\[name\]/g, name)
    .replace(/--+/g, '-')
    .replace(/-$/, '')
}

async function parseSvgToSymbol(
  compiler: SVGCompiler,
  svgCode: string,
  id: string,
  path: string,
) {
  const content = svgCode.replace(/stroke="[a-zA-Z#0-9]*"/, 'stroke="currentColor"')
  const symbol = await compiler.addSymbol({
    path,
    content,
    id,
  })
  return symbol.render()
}

export async function createSvgSpriteHtml(opt: SvgIconsOpt): Promise<SvgSpriteResult> {
  const options = {
    svgoOptions: true,
    symbolId: 'icon-[dir]-[name]',
    customDomId: SVG_DOM_ID,
    ...opt,
  }
  const iconDirs = options.iconDirs.map((dir) => resolve(dir))

  const files = await fg(iconDirs.map((dir) => `${normalizePath(dir)}/**/*.svg`), {
    onlyFiles: true,
    absolute: true,
    unique: true,
  })

  const symbols: string[] = []
  const symbolIds: string[] = []
  const compiler = new SVGCompiler()

  for (const file of files) {
    const iconDir = iconDirs.find((dir) => normalizePath(file).startsWith(normalizePath(dir)))
    if (!iconDir) continue
    const content = await readFile(file, 'utf-8')
    const symbolId = createSymbolIdByPattern(options.symbolId, file, iconDir)
    const optimized = options.svgoOptions
      ? optimize(content, { path: file, multipass: true }).data
      : content
    symbols.push(await parseSvgToSymbol(compiler, optimized, symbolId, file))
    symbolIds.push(symbolId)
  }

  const html = `<svg xmlns="${XMLNS}" xmlns:xlink="${XMLNS_LINK}" style="position:absolute;width:0;height:0;overflow:hidden" id="${options.customDomId}" aria-hidden="true">${symbols.join('')}</svg>`
  return { html, symbolIds }
}

export async function createSvgIconsPlugin(opt: SvgIconsOpt) {
  const cache = new Map<string, FileStats>()

  let isBuild = false
  const options = {
    svgoOptions: true,
    symbolId: 'icon-[dir]-[name]',
    inject: 'body-last' as const,
    customDomId: SVG_DOM_ID,
    ...opt,
  }

  const iconDirs = options.iconDirs.map((dir) => resolve(dir))
  let insertHtml = ''
  let symbolIds: string[] = []

  function createSymbolId(filePath: string, iconDir: string) {
    return createSymbolIdByPattern(options.symbolId, filePath, iconDir)
  }

  async function compilerIcons() {
    const files = await fg(iconDirs.map((dir) => `${normalizePath(dir)}/**/*.svg`), {
      onlyFiles: true,
      absolute: true,
      unique: true,
    })

    const compiler = new SVGCompiler()
    const symbols = await Promise.all(
      files.map(async (file) => {
        const iconDir = iconDirs.find((dir) => normalizePath(file).startsWith(normalizePath(dir)))
        if (!iconDir) {
          return ''
        }

        const relativeName = normalizePath(relative(iconDir, file))
        const content = await readFile(file, 'utf-8')
        const symbolId = createSymbolId(file, iconDir)
        const optimized = options.svgoOptions
          ? optimize(content, { path: file, multipass: true }).data
          : content

        cache.set(file, {
          relativeName,
          code: optimized,
          symbolId,
        })
        return parseSvgToSymbol(compiler, optimized, symbolId, file)
      }),
    )

    symbolIds = [...cache.values()].map((item) => item.symbolId || '').filter(Boolean)
    const symbolsHtml = symbols.filter(Boolean).join('')
    insertHtml = `<svg xmlns="${XMLNS}" xmlns:xlink="${XMLNS_LINK}" style="position:absolute;width:0;height:0;overflow:hidden" id="${options.customDomId}" aria-hidden="true">${symbolsHtml}</svg>`
  }

  function getRegisterJs() {
    return `
const svgSprite = ${JSON.stringify(insertHtml)};
const domId = ${JSON.stringify(options.customDomId)};
const injectPos = ${JSON.stringify(options.inject)};

function injectSvgSprite() {
  if (!svgSprite || document.getElementById(domId)) return;
  if (injectPos === 'body-first') {
    document.body.insertAdjacentHTML('afterbegin', svgSprite);
  } else {
    document.body.insertAdjacentHTML('beforeend', svgSprite);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSvgSprite, { once: true });
} else {
  injectSvgSprite();
}
`
  }

  await compilerIcons()

  const plugin: ViteLikePlugin = {
    name: 'create-svg-icons',
    enforce: 'pre',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    async buildStart() {
      if (!isBuild) {
        await compilerIcons()
      }
    },
    resolveId(id) {
      if (id === SVG_ICONS_REGISTER_NAME || id === SVG_ICONS_CLIENT) {
        return id
      }
      return null
    },
    async load(id) {
      if (id === SVG_ICONS_REGISTER_NAME) {
        return getRegisterJs()
      }
      if (id === SVG_ICONS_CLIENT) {
        return `export default ${JSON.stringify(symbolIds)}`
      }
      return null
    },
    transformIndexHtml(html) {
      if (!insertHtml) return html
      if (options.inject === 'body-first') {
        return html.replace('<body>', `<body>${insertHtml}`)
      }
      return html.replace('</body>', `${insertHtml}</body>`)
    },
  }

  return plugin
}
