import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@go-tech-frontend/ui";
import {
  CSSProperties,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

enum BlockType {
  Hero = "hero",
  Text = "text",
  Button = "button",
  Image = "image",
}

enum PageKey {
  Home = "home",
  SystemFeatures = "system-features",
  TargetAudience = "target-audience",
  CoreAdvantages = "core-advantages",
}

type SelectedElementInfo = {
  id: string;
  tagName: string;
  className: string;
  innerHTML: string;
  outerHTML: string;
  dataset?: Record<string, string>;
  styles?: {
    fontSize?: string;
    color?: CSSProperties["color"];
    backgroundColor?: CSSProperties["backgroundColor"];
    backgroundImage?: string;
    width?: string;
    height?: string;
    borderRadius?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    textAlign?: CSSProperties["textAlign"];
  };
};

type AdminBlockBase = {
  id: string;
  type: BlockType;
};

type AdminHeroBlock = AdminBlockBase & {
  type: BlockType.Hero;
  title: string;
  titleSecondary?: string;
  subtitle: string;
  titleStyle?: CSSProperties;
  titleSecondaryStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage: string;
  overlayGradient?: string;
  buttonStyle?: string;
  sectionStyle?: CSSProperties;
  contentStyle?: CSSProperties;
};

type AdminTextBlock = AdminBlockBase & {
  type: BlockType.Text;
  text: string;
  align?: CSSProperties["textAlign"];
};

type AdminButtonBlock = AdminBlockBase & {
  type: BlockType.Button;
  text: string;
  href: string;
  buttonStyle?: CSSProperties;
};

type AdminImageBlock = AdminBlockBase & {
  type: BlockType.Image;
  src: string;
  alt: string;
};

type AdminBlock =
  | AdminHeroBlock
  | AdminTextBlock
  | AdminButtonBlock
  | AdminImageBlock;

export default function PanlEditor({
  iframeRef,
}: {
  iframeRef: RefObject<HTMLIFrameElement>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElementInfo | null>(null);

  const [textContent, setTextContent] = useState("");
  const [textSize, setTextSize] = useState("16");
  const [textColor, setTextColor] = useState<CSSProperties["color"]>("#111827");
  const [lineHeight, setLineHeight] = useState("");

  const [buttonLabel, setButtonLabel] = useState("了解更多");
  const [buttonTextSize, setButtonTextSize] = useState("16");
  const [buttonTextColor, setButtonTextColor] =
    useState<CSSProperties["color"]>("#ffffff");
  const [buttonBgColor, setButtonBgColor] =
    useState<CSSProperties["color"]>("#2563eb");
  const [buttonWidth, setButtonWidth] = useState("140");
  const [buttonHeight, setButtonHeight] = useState("44");
  const [buttonLink, setButtonLink] = useState("");

  const [borderRadius, setBorderRadius] = useState("");
  const [paddingSize, setPaddingSize] = useState("");
  const [marginSize, setMarginSize] = useState("");
  const [textAlign, setTextAlign] =
    useState<CSSProperties["textAlign"]>("left");

  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");

  const [blocks, setBlocks] = useState<AdminBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string>("home-hero");
  const blocksRef = useRef<AdminBlock[]>([]);
  const [pageKey, setPageKey] = useState<PageKey>(PageKey.Home);
  const [selectedBlockMeta, setSelectedBlockMeta] = useState<{
    blockId?: string;
    role?: string;
  } | null>(null);

  const selectedSummary = useMemo(() => {
    if (!selectedElement) return "未選中元素";
    const tag = selectedElement.tagName.toUpperCase();
    const className = selectedElement.className
      ? `.${selectedElement.className}`
      : "";
    return `${tag}${className}`;
  }, [selectedElement]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== import.meta.env.VITE_H5_SITE_URL) {
      return;
    }

    if (event.data && event.data.type === "ELEMENT_CLICKED") {
      const clickedElement = event.data.element;
      if (!clickedElement?.id) return;

      setSelectedElement({
        id: clickedElement.id,
        tagName: clickedElement.tagName,
        className: clickedElement.className,
        innerHTML: clickedElement.innerHTML || "",
        outerHTML: clickedElement.outerHTML || "",
        dataset: clickedElement.dataset || {},
        styles: clickedElement.styles || {},
      });
      if (clickedElement.dataset?.blockId) {
        setActiveBlockId(clickedElement.dataset.blockId);
        setSelectedBlockMeta({
          blockId: clickedElement.dataset.blockId,
          role: clickedElement.dataset.blockRole,
        });
        setButtonLink(clickedElement.dataset.blockLink);
      } else {
        setSelectedBlockMeta(null);
      }

      setTextContent(clickedElement.innerHTML || "");
      if (clickedElement.styles?.fontSize) {
        setTextSize(clickedElement.styles.fontSize.replace("px", ""));
      }
      if (clickedElement.styles?.color) {
        setTextColor(rgbToHex(clickedElement.styles.color));
      }
      if (clickedElement.styles?.backgroundColor) {
        setButtonBgColor(rgbToHex(clickedElement.styles.backgroundColor));
      }
      if (clickedElement.styles?.backgroundImage) {
        setBackgroundImageUrl(
          extractUrl(clickedElement.styles.backgroundImage),
        );
      }
      if (clickedElement.styles?.width) {
        setButtonWidth(clickedElement.styles.width.replace("px", ""));
      }
      if (clickedElement.styles?.height) {
        setButtonHeight(clickedElement.styles.height.replace("px", ""));
      }
      if (clickedElement.styles?.borderRadius) {
        setBorderRadius(clickedElement.styles.borderRadius);
      }
      if (clickedElement.styles?.padding) {
        setPaddingSize(clickedElement.styles.padding);
      }
      if (clickedElement.styles?.margin) {
        setMarginSize(clickedElement.styles.margin);
      }
      if (clickedElement.styles?.textAlign) {
        const alignValue = normalizeAlign(clickedElement.styles.textAlign);
        if (alignValue) setTextAlign(alignValue);
      }
      if (clickedElement.styles?.lineHeight) {
        setLineHeight(clickedElement.styles.lineHeight);
      }

      if (clickedElement.dataset.blockRole === "buttonText") {
        setButtonLabel(clickedElement.innerHTML);
        const buttonStyles = clickedElement.styles as CSSStyleDeclaration;

        setButtonTextSize(buttonStyles.fontSize.replace("px", ""));
        setButtonBgColor(colorToHex(buttonStyles.backgroundColor));
        setButtonTextColor(colorToHex(buttonStyles.color));
        // 获取按钮链接
        console.log(clickedElement);
      }
    }

    if (event.data && event.data.type === "PAGE_BLOCKS_SYNC") {
      if (!Array.isArray(event.data.blocks)) return;
      const nextPage = event.data.page as PageKey;
      if (nextPage) setPageKey(nextPage);
      setBlocks(event.data.blocks as AdminBlock[]);
      const firstId = event.data.blocks[0]?.id as string | undefined;
      if (firstId) setActiveBlockId(firstId);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const postToIframe = (payload: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      payload,
      import.meta.env.VITE_H5_SITE_URL,
    );
  };

  const clearSelection = () => {
    setSelectedElement(null);
    postToIframe({ type: "CLEAR_SELECTION" });
  };

  const handleApplyText = () => {
    if (!selectedElement) return;
    postToIframe({
      type: "UPDATE_ELEMENT_TEXT",
      id: selectedElement.id,
      text: textContent,
    });

    const style: CSSProperties = {
      fontSize: textSize ? Number(textSize) : "1rem",
      color: textColor || undefined,
      padding: paddingSize ? paddingSize : "",
      margin: marginSize ? marginSize : "",
      textAlign: textAlign || "left",
      lineHeight: lineHeight ? lineHeight : "",
    };
    postToIframe({
      type: "UPDATE_ELEMENT_STYLE",
      id: selectedElement.id,
      style,
    });
    syncBlockFromSelection(textContent, style);
  };

  const handleApplyButton = () => {
    if (!selectedElement) return;
    postToIframe({
      type: "UPDATE_ELEMENT_TEXT",
      id: selectedElement.id,
      text: buttonLabel,
    });

    const style: CSSProperties = {
      fontSize: buttonTextSize ? Number(buttonTextSize) : "1rem",
      color: buttonTextColor || "initial",
      backgroundColor: buttonBgColor || "initial",
      width: buttonWidth ? Number(buttonWidth) : "initial",
      height: buttonHeight ? Number(buttonHeight) : "initial",
      borderRadius: borderRadius ? borderRadius : "",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: paddingSize ? paddingSize : "",
      margin: marginSize ? marginSize : "",
      textAlign: textAlign || "initial",
    };
    postToIframe({
      type: "UPDATE_ELEMENT_STYLE",
      id: selectedElement.id,
      style,
    });
    syncBlockFromSelection(buttonLabel, style, buttonLink);
  };

  const handleCreateText = () => {
    postToIframe({
      type: "CREATE_TEXT_ELEMENT",
      text: textContent || "請輸入文字",
      style: {
        fontSize: textSize ? Number(textSize) : undefined,
        color: textColor || undefined,
      },
      parentId: selectedElement?.id,
    });
  };

  const handleCreateButton = () => {
    postToIframe({
      type: "CREATE_BUTTON_ELEMENT",
      label: buttonLabel || "按鈕",
      style: {
        fontSize: buttonTextSize ? Number(buttonTextSize) : undefined,
        color: buttonTextColor || undefined,
        backgroundColor: buttonBgColor || undefined,
        width: buttonWidth ? Number(buttonWidth) : undefined,
        height: buttonHeight ? Number(buttonHeight) : undefined,
        borderRadius: 8,
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      },
      parentId: selectedElement?.id,
    });
  };

  const handleApplyBackground = () => {
    postToIframe({
      id: selectedElement.id,
      type: "SET_BACKGROUND_IMAGE",
      url: backgroundImageUrl,
    });
    if (
      selectedBlockMeta?.blockId &&
      selectedBlockMeta?.role === "background"
    ) {
      updateBlock({ backgroundImage: backgroundImageUrl });
    }
  };

  const syncBlockFromSelection = (
    value: string,
    style: CSSProperties,
    link?: string,
  ) => {
    if (!selectedBlockMeta?.blockId || !selectedBlockMeta?.role) return;
    if (selectedBlockMeta.blockId !== activeBlockId) return;

    switch (selectedBlockMeta.role) {
      case "title":
        updateBlock({ title: value, titleStyle: style });
        break;
      case "titleSecondary":
        updateBlock({ titleSecondary: value, titleSecondaryStyle: style });
        break;
      case "subtitle":
        updateBlock({ subtitle: value, subtitleStyle: style });
        break;
      case "buttonText":
        updateBlock({ buttonText: value, buttonStyle: style, href: link });
        break;
      case "text":
        updateBlock({ text: value });
        break;
      default:
        break;
    }
  };

  const updateBlock = (patch: Partial<AdminBlock>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === activeBlockId
          ? ({ ...block, ...patch } as AdminBlock)
          : block,
      ),
    );
  };

  const addBlock = (type: AdminBlock["type"]) => {
    const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nextBlock: AdminBlock =
      type === BlockType.Hero
        ? {
            id,
            type: BlockType.Hero,
            title: "主標題",
            subtitle: "副標題內容",
            titleStyle: {
              fontSize: "3rem",
              color: "var(--color-background)",
              lineHeight: "1.25",
            },
            titleSecondaryStyle: {
              fontSize: "3rem",
              color: "var(--color-background)",
            },
            subtitleStyle: {
              color: "var(--color-primary)",
              fontSize: "1.825rem",
            },
            backgroundImage: "",
          }
        : type === BlockType.Text
          ? { id, type: BlockType.Text, text: "請輸入文字", align: "left" }
          : type === BlockType.Button
            ? {
                id,
                type: BlockType.Button,
                text: "按鈕",
                href: "/account/register",
              }
            : { id, type: BlockType.Image, src: "", alt: "圖片" };

    setBlocks((prev) => [...prev, nextBlock]);
    setActiveBlockId(id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    if (activeBlockId === id && blocks.length > 1) {
      const nextId = blocks.find((block) => block.id !== id)?.id;
      if (nextId) setActiveBlockId(nextId);
    }
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      if (index === -1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return next;
    });
  };

  const applyBlocksToPreview = async () => {
    postToIframe({
      type: "SET_PAGE_BLOCKS",
      page: pageKey,
      blocks: blocksRef.current,
    });

    try {
      await fetch(`/h5-hook/api/page-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pageKey,
          blocks: blocksRef.current,
        }),
      });
    } catch {
      // ignore save errors for now
    }
  };

  const handleExportJson = () => {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      pages: {
        [pageKey]: blocksRef.current,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pageKey}-blocks.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const nextBlocks =
          parsed?.pages?.[pageKey] ||
          parsed?.blocks ||
          parsed?.[pageKey] ||
          null;
        if (!Array.isArray(nextBlocks)) return;
        setBlocks(nextBlocks as AdminBlock[]);
        const firstId = nextBlocks[0]?.id as string | undefined;
        if (firstId) setActiveBlockId(firstId);
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      <div className="rounded-2xl border border-border bg-linear-to-br from-background to-muted/30 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              页面编辑器
            </div>
            <div className="text-lg font-semibold text-foreground">
              首页 / 组件组装
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              同步后会实时更新左侧预览。
            </div>
          </div>
          <div className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
            预览中
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={applyBlocksToPreview}>
            同步到预览
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportJson}>
            导出 JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            导入 JSON
          </Button>
          <Button size="sm" variant="outline" onClick={clearSelection}>
            清除选中
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportJson(file);
            if (e.target) e.target.value = "";
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选中元素</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">当前选中</div>
          <div className="text-base font-semibold">{selectedSummary}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {selectedElement?.outerHTML || "请点击左侧页面中的可编辑区块"}
          </div>
        </CardContent>
      </Card>

      {selectedElement ? (
        <>
          {isButtonElement(selectedElement.tagName) ? (
            <Card>
              <CardHeader>
                <CardTitle>按钮样式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="buttonLabel">按钮文案</Label>
                  <Input
                    id="buttonLabel"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    placeholder="输入按钮文字"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="buttonTextSize">字号(px)</Label>
                    <Input
                      id="buttonTextSize"
                      type="number"
                      min="10"
                      value={buttonTextSize}
                      onChange={(e) => setButtonTextSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonTextColor">文字颜色</Label>
                    <Input
                      id="buttonTextColor"
                      type="color"
                      value={buttonTextColor}
                      onChange={(e) => setButtonTextColor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonBgColor">背景色</Label>
                    <Input
                      id="buttonBgColor"
                      type="color"
                      value={buttonBgColor}
                      onChange={(e) => setButtonBgColor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonRadius">圆角(px)</Label>
                    <Input
                      id="buttonRadius"
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonWidth">宽度(px)</Label>
                    <Input
                      id="buttonWidth"
                      type="number"
                      min="60"
                      value={buttonWidth}
                      onChange={(e) => setButtonWidth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonHeight">高度(px)</Label>
                    <Input
                      id="buttonHeight"
                      type="number"
                      min="28"
                      value={buttonHeight}
                      onChange={(e) => setButtonHeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonLink">链接</Label>
                    <Input
                      id="buttonLink"
                      value={buttonLink}
                      onChange={(e) => setButtonLink(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleApplyButton}>
                    应用到选中
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCreateButton}
                  >
                    新增按钮
                  </Button> */}
                </div>
              </CardContent>
            </Card>
          ) : isBackgroundEligible(selectedElement.tagName) ? (
            <Card>
              <CardHeader>
                <CardTitle>页面背景</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="backgroundImageUrl">背景图地址</Label>
                  <Input
                    id="backgroundImageUrl"
                    value={backgroundImageUrl}
                    onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>
                <Button onClick={handleApplyBackground}>设置背景图</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>文字样式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="textContent">内容</Label>
                  <Textarea
                    id="textContent"
                    rows={3}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="输入文字"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="textSize">字号(px)</Label>
                    <Input
                      id="textSize"
                      type="number"
                      min="10"
                      value={textSize}
                      onChange={(e) => setTextSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">文字颜色</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="textAlign">对齐</Label>
                    <select
                      id="textAlign"
                      value={textAlign}
                      onChange={(e) =>
                        setTextAlign(
                          e.target.value as "left" | "center" | "right",
                        )
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paddingSize">内边距</Label>
                    <Input
                      id="paddingSize"
                      value={paddingSize}
                      onChange={(e) => setPaddingSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marginSize">外边距</Label>
                    <Input
                      id="marginSize"
                      min="0"
                      value={marginSize}
                      onChange={(e) => setMarginSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marginSize">行高</Label>
                    <Input
                      id="marginSize"
                      min="0"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleApplyText}>
                    应用到选中
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCreateText}
                  >
                    新增文字
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

function colorToHex(color: string) {
  return color.startsWith("#")
    ? color
    : color.startsWith("rgb")
      ? rgbToHex(color)
      : color.startsWith("hsl")
        ? hslToHex(color)
        : color.startsWith("oklab")
          ? oklabToHex(color)
          : color;
}

function hslToHex(hsl: string) {
  const parts = hsl.match(/-?\d*\.?\d+%?/g);
  if (!parts || parts.length < 3) return "#000000";

  const parsePercent = (value: string) => {
    if (value.endsWith("%")) return parseFloat(value) / 100;
    const num = parseFloat(value);
    if (Number.isNaN(num)) return 0;
    return num > 1 ? num / 100 : num;
  };

  let hue = parseFloat(parts[0]);
  if (!Number.isFinite(hue)) hue = 0;
  hue = ((hue % 360) + 360) % 360;

  const s = parsePercent(parts[1]);
  const l = parsePercent(parts[2]);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value: number) => {
    const v = Math.round((value + m) * 255);
    const clamped = Math.min(255, Math.max(0, v));
    return clamped.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function oklabToHex(oklab: string) {
  const parts = oklab.match(/-?\d*\.?\d+%?/g);
  if (!parts || parts.length < 3) return "#000000";

  const parseL = (value: string) => {
    if (value.endsWith("%")) return parseFloat(value) / 100;
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return 0;
    return num > 1 ? num / 100 : num;
  };

  const parseAB = (value: string) => {
    if (value.endsWith("%")) return parseFloat(value) / 100;
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : 0;
  };

  const L = parseL(parts[0]);
  const a = parseAB(parts[1]);
  const b = parseAB(parts[2]);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toSRgb = (value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  r = toSRgb(r);
  g = toSRgb(g);
  b2 = toSRgb(b2);

  const toHex = (value: number) => {
    const v = Math.round(value * 255);
    const clamped = Math.min(255, Math.max(0, v));
    return clamped.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b2)}`;
}

const rgbToHex = (rgb: string) => {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return "#000000";
  const [r, g, b] = result.map((value) => parseInt(value, 10));
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const normalizeAlign = (value?: string) => {
  if (!value) return null;
  if (value.includes("center")) return "center" as const;
  if (value.includes("right") || value.includes("end")) return "right" as const;
  return "left" as const;
};

const extractUrl = (value?: string) => {
  if (!value || value === "none") return "";
  const match = value.match(/url\((['"]?)(.*?)\1\)/);
  return match?.[2] || "";
};

const isButtonElement = (tagName?: string) => {
  if (!tagName) return false;
  const tag = tagName.toLowerCase();
  return tag === "button" || tag === "a";
};

const isBackgroundEligible = (tagName?: string) => {
  if (!tagName) return false;
  const tag = tagName.toLowerCase();
  return tag === "body" || tag === "section" || tag === "div";
};
