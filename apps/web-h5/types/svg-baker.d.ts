declare module 'svg-baker' {
  interface AddSymbolOptions {
    path: string
    content: string
    id?: string
  }

  interface SpriteSymbol {
    render(): string
  }

  export default class SVGCompiler {
    addSymbol(options: AddSymbolOptions): Promise<SpriteSymbol>
  }
}
