declare module 'svg-baker' {
  interface AddSymbolOptions {
    content: string;
    id?: string;
    path: string;
  }

  interface SpriteSymbol {
    render(): string;
  }

  export default class SVGCompiler {
    addSymbol(options: AddSymbolOptions): Promise<SpriteSymbol>;
  }
}
