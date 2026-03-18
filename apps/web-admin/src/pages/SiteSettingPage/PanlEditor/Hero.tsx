import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileUpload,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  UploadedFile,
} from "@go-tech-frontend/ui";
import { useAsyncEffect } from "ahooks";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { AdminHeroBlock } from "./type";
import {
  extractUrl,
  fetchAndConvertToFile,
  normalizeAlign,
  rgbToHex,
} from "./utils";

function readSnapshotStyle(element: Element | null, cssProp: string) {
  if (!element) return "";
  const raw = element.getAttribute("data-computed-style");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[cssProp] || "";
  } catch {
    return "";
  }
}

function getStyleValue(
  element: Element | null,
  cssProp: string,
  fallbackCamelProp?: keyof CSSStyleDeclaration,
) {
  if (!element) return "";
  const snapshotValue = readSnapshotStyle(element, cssProp);
  if (snapshotValue) return snapshotValue;

  const view = element.ownerDocument?.defaultView;
  if (!view) return "";

  const computed = view.getComputedStyle(element);
  if (computed.getPropertyValue(cssProp)) {
    return computed.getPropertyValue(cssProp);
  }

  if (fallbackCamelProp && computed[fallbackCamelProp]) {
    return computed[fallbackCamelProp] as string;
  }

  return "";
}

function Editor({
  element,
  sync,
  onPatchBlock,
}: {
  element: Element;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: Partial<AdminHeroBlock>,
  ) => void;
}) {
  const originBg = element.querySelector('[data-block-role="background"]');
  const orignBgImg = extractUrl(
    getStyleValue(originBg, "background-image", "backgroundImage"),
  );
  const file = useRef<File | null>(null);

  const originTitle = element.querySelector('[data-block-role="title"]');
  const originTitleSecondary = element.querySelector(
    '[data-block-role="titleSecondary"]',
  );
  const originSubtitle = element.querySelector('[data-block-role="subtitle"]');
  const originButton = element.querySelector('[data-block-role="buttonText"]');

  const titleInfo = {
    content: originTitle?.textContent || "",
    style: {
      fontSize: getStyleValue(originTitle, "font-size", "fontSize").replace(
        "px",
        "",
      ),
      color: rgbToHex(getStyleValue(originTitle, "color")),
      align: normalizeAlign(
        getStyleValue(originTitle, "text-align", "textAlign"),
      ),
      padding: getStyleValue(originTitle, "padding"),
      margin: getStyleValue(originTitle, "margin"),
      lineHeight: getStyleValue(originTitle, "line-height"),
    },
  };
  const titleSecondaryInfo = {
    content: originTitleSecondary?.textContent || "",
    style: {
      fontSize: getStyleValue(
        originTitleSecondary,
        "font-size",
        "fontSize",
      ).replace("px", ""),
      color: rgbToHex(getStyleValue(originTitleSecondary, "color")),
      align: normalizeAlign(
        getStyleValue(originTitleSecondary, "text-align", "textAlign"),
      ),
      padding: getStyleValue(originTitleSecondary, "padding"),
      margin: getStyleValue(originTitleSecondary, "margin"),
      lineHeight: getStyleValue(originTitleSecondary, "line-height"),
    },
  };
  const subTitleInfo = {
    content: originSubtitle?.textContent || "",
    style: {
      fontSize: getStyleValue(originSubtitle, "font-size", "fontSize").replace(
        "px",
        "",
      ),
      color: rgbToHex(getStyleValue(originSubtitle, "color")),
      align: normalizeAlign(
        getStyleValue(originSubtitle, "text-align", "textAlign"),
      ),
      padding: getStyleValue(originSubtitle, "padding"),
      margin: getStyleValue(originSubtitle, "margin"),
      lineHeight: getStyleValue(originSubtitle, "line-height"),
    },
  };
  const buttonInfo = {
    content: originButton?.textContent || "",
    link: (originButton as HTMLButtonElement)?.dataset?.blockLink || "",
    style: {
      fontSize: getStyleValue(originButton, "font-size", "fontSize").replace(
        "px",
        "",
      ),
      color: rgbToHex(getStyleValue(originButton, "color")),
      backgroundColor: rgbToHex(
        getStyleValue(originButton, "background-color", "backgroundColor"),
      ),
      width: getStyleValue(originButton, "width").replace("px", ""),
      height: getStyleValue(originButton, "height").replace("px", ""),
      borderRadius: getStyleValue(originButton, "border-radius").replace(
        "px",
        "",
      ),
    },
  };

  const [title, setTitle] = useState(titleInfo);
  const [titleSecondary, setTitleSecondary] = useState(titleSecondaryInfo);
  const [subtitle, setSubtitle] = useState(subTitleInfo);
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [button, setButton] = useState(buttonInfo);

  useAsyncEffect(async () => {
    if (orignBgImg) {
      file.current = await fetchAndConvertToFile(orignBgImg);
      setFileList([
        {
          id: new Date().getTime().toString(),
          file: file.current,
          previewUrl: orignBgImg,
          status: "success",
          progress: 100,
          url: orignBgImg,
        },
      ]);
    }
  }, [orignBgImg]);

  useEffect(() => {
    return () => {
      file.current = null;
      setFileList([]);
    };
  }, []);

  /**
   * 同步背景图片
   */
  const handleApplyBackground = () => {
    const url = fileList.find((file) => file.status === "success")?.url;
    const blockId = (originBg as HTMLElement)?.dataset?.blockId;
    const blockSeq = (originBg as HTMLElement)?.dataset?.blockSeq
      ? Number((originBg as HTMLElement)?.dataset?.blockSeq)
      : undefined;

    sync({
      type: "SET_BACKGROUND_IMAGE",
      url: url,
      block: {
        id: (originBg as HTMLElement).dataset.blockId,
        role: (originBg as HTMLElement).dataset.blockRole,
        seq: (originBg as HTMLElement).dataset.blockSeq,
      },
    });

    if (blockId && url) {
      onPatchBlock(blockId, blockSeq, { backgroundImage: url });
    }
  };

  /**
   * 同步文字
   */
  const handleApplyText = (
    content: {
      content: string;
      style: {
        fontSize: string;
        color: string;
        align: "left" | "center" | "right";
        padding: string;
        margin: string;
        lineHeight: string;
      };
    },
    el: Element | null,
    patch: Partial<AdminHeroBlock>,
  ) => {
    if (!el) return;
    const blockId = (el as HTMLElement).dataset.blockId;
    const blockSeq = (el as HTMLElement).dataset.blockSeq
      ? Number((el as HTMLElement).dataset.blockSeq)
      : undefined;
    const style: CSSProperties = {
      fontSize: content.style.fontSize
        ? Number(content.style.fontSize)
        : "1rem",
      color: content.style.color || undefined,
      padding: content.style.padding ? content.style.padding : "",
      margin: content.style.margin ? content.style.margin : "",
      textAlign: content.style.align || "left",
      lineHeight: content.style.lineHeight ? content.style.lineHeight : "",
    };
    sync({
      type: "UPDATE_ELEMENT_TEXT",
      text: content.content,
      block: {
        id: (el as HTMLElement).dataset.blockId,
        role: (el as HTMLElement).dataset.blockRole,
        seq: (el as HTMLElement).dataset.blockSeq,
      },
    });

    sync({
      type: "UPDATE_ELEMENT_STYLE",
      style,
      block: {
        id: (el as HTMLElement).dataset.blockId,
        role: (el as HTMLElement).dataset.blockRole,
        seq: (el as HTMLElement).dataset.blockSeq,
      },
    });

    if (blockId) {
      onPatchBlock(blockId, blockSeq, patch);
    }
  };

  // 同步标题
  const applySyncTitle = () => {
    handleApplyText(title, originTitle, {
      title: title.content,
      titleStyle: {
        fontSize: title.style.fontSize
          ? Number(title.style.fontSize)
          : undefined,
        color: title.style.color || undefined,
        padding: title.style.padding || undefined,
        margin: title.style.margin || undefined,
        textAlign: title.style.align || undefined,
        lineHeight: title.style.lineHeight || undefined,
      },
    });
  };

  // 同步副标题
  const applySyncTitleSecondary = () => {
    handleApplyText(titleSecondary, originTitleSecondary, {
      titleSecondary: titleSecondary.content,
      titleSecondaryStyle: {
        fontSize: titleSecondary.style.fontSize
          ? Number(titleSecondary.style.fontSize)
          : undefined,
        color: titleSecondary.style.color || undefined,
        padding: titleSecondary.style.padding || undefined,
        margin: titleSecondary.style.margin || undefined,
        textAlign: titleSecondary.style.align || undefined,
        lineHeight: titleSecondary.style.lineHeight || undefined,
      },
    });
  };

  // 同步子标题
  const applySyncSubTitle = () => {
    handleApplyText(subtitle, originSubtitle, {
      subtitle: subtitle.content,
      subtitleStyle: {
        fontSize: subtitle.style.fontSize
          ? Number(subtitle.style.fontSize)
          : undefined,
        color: subtitle.style.color || undefined,
        padding: subtitle.style.padding || undefined,
        margin: subtitle.style.margin || undefined,
        textAlign: subtitle.style.align || undefined,
        lineHeight: subtitle.style.lineHeight || undefined,
      },
    });
  };

  // 同步按钮
  const applySyncButton = () => {
    try {
      const blockId = (originButton as HTMLElement).dataset.blockId;
      const blockRole = (originButton as HTMLElement).dataset.blockRole;
      const blockSeq = (originButton as HTMLElement).dataset.blockSeq
        ? Number((originButton as HTMLElement).dataset.blockSeq)
        : undefined;
      const style: CSSProperties = {
        fontSize: button.style.fontSize
          ? Number(button.style.fontSize)
          : "1rem",
        color: button.style.color || undefined,
        backgroundColor: button.style.backgroundColor || undefined,
        width: button.style.width ? Number(button.style.width) : undefined,
        height: button.style.height ? Number(button.style.height) : undefined,
        borderRadius: button.style.borderRadius
          ? Number(button.style.borderRadius)
          : undefined,
      };
      sync({
        type: "UPDATE_ELEMENT_TEXT",
        text: button.content,
        block: {
          id: blockId,
          role: blockRole,
          seq: blockSeq,
        },
      });

      sync({
        type: "UPDATE_ELEMENT_STYLE",
        style,
        block: {
          id: blockId,
          role: blockRole,
          seq: blockSeq,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>页面背景</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="backgroundImageUrl">背景图</Label>
            <FileUpload
              maxCount={1}
              list={fileList}
              uploadUrl="/api/pms-resource/web-back/minio/upload"
              onChange={(files) => {
                setFileList(files);
              }}
            />
          </div>
          <Button onClick={handleApplyBackground}>设置背景图</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>标题样式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="textContent">内容</Label>
            <Textarea
              id="textContent"
              rows={3}
              placeholder="输入文字"
              value={title.content}
              onChange={(e) => {
                setTitle((prev) => ({
                  ...prev,
                  content: e.target.value,
                }));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="textSize">字号(px)</Label>
              <Input
                id="textSize"
                type="number"
                min="10"
                value={Number(title.style.fontSize)}
                onChange={(e) => {
                  setTitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      fontSize: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">文字颜色</Label>
              <Input
                id="textColor"
                type="color"
                value={title.style.color}
                onChange={(e) => {
                  setTitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      color: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="textAlign">对齐</Label>
              <select
                id="textAlign"
                value={title.style.align}
                onChange={(e) => {
                  setTitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      align: e.target.value as "left" | "center" | "right",
                    },
                  }));
                }}
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
                value={title.style.padding}
                onChange={(e) => {
                  setTitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      padding: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginSize">外边距</Label>
              <Input
                id="marginSize"
                min="0"
                value={title.style.margin}
                onChange={(e) => {
                  setTitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      margin: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginSize">行高</Label>
              <Input
                id="marginSize"
                min="0"
                value={title.style.lineHeight}
                onChange={(e) => {
                  setTitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      lineHeight: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applySyncTitle}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>副標題样式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="textContent">内容</Label>
            <Textarea
              id="textContent"
              rows={3}
              placeholder="输入文字"
              value={titleSecondary.content}
              onChange={(e) => {
                setTitleSecondary((prev) => ({
                  ...prev,
                  content: e.target.value,
                }));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="textSize">字号(px)</Label>
              <Input
                id="textSize"
                type="number"
                min="10"
                value={Number(titleSecondary.style.fontSize)}
                onChange={(e) => {
                  setTitleSecondary((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      fontSize: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">文字颜色</Label>
              <Input
                id="textColor"
                type="color"
                value={titleSecondary.style.color}
                onChange={(e) => {
                  setTitleSecondary((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      color: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="textAlign">对齐</Label>
              <select
                id="textAlign"
                value={titleSecondary.style.align}
                onChange={(e) => {
                  setTitleSecondary((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      align: e.target.value as "left" | "center" | "right",
                    },
                  }));
                }}
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
                value={titleSecondary.style.padding}
                onChange={(e) => {
                  setTitleSecondary((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      padding: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginSize">外边距</Label>
              <Input
                id="marginSize"
                min="0"
                value={titleSecondary.style.margin}
                onChange={(e) => {
                  setTitleSecondary((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      margin: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginSize">行高</Label>
              <Input
                id="marginSize"
                min="0"
                value={titleSecondary.style.lineHeight}
                onChange={(e) => {
                  setTitleSecondary((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      lineHeight: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applySyncTitleSecondary}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>子标题样式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="textContent">内容</Label>
            <Textarea
              id="textContent"
              rows={3}
              placeholder="输入文字"
              value={subtitle.content}
              onChange={(e) => {
                setSubtitle((prev) => ({
                  ...prev,
                  content: e.target.value,
                }));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="textSize">字号(px)</Label>
              <Input
                id="textSize"
                type="number"
                min="10"
                value={Number(subtitle.style.fontSize)}
                onChange={(e) => {
                  setSubtitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      fontSize: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">文字颜色</Label>
              <Input
                id="textColor"
                type="color"
                value={subtitle.style.color}
                onChange={(e) => {
                  setSubtitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      color: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="textAlign">对齐</Label>
              <select
                id="textAlign"
                value={subtitle.style.align}
                onChange={(e) => {
                  setSubtitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      align: e.target.value as "left" | "center" | "right",
                    },
                  }));
                }}
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
                value={subtitle.style.padding}
                onChange={(e) => {
                  setSubtitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      padding: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginSize">外边距</Label>
              <Input
                id="marginSize"
                min="0"
                value={subtitle.style.margin}
                onChange={(e) => {
                  setSubtitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      margin: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginSize">行高</Label>
              <Input
                id="marginSize"
                min="0"
                value={subtitle.style.lineHeight}
                onChange={(e) => {
                  setSubtitle((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      lineHeight: e.target.value,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applySyncSubTitle}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>按钮样式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="buttonLabel">按钮文案</Label>
            <Input
              id="buttonLabel"
              placeholder="输入按钮文字"
              value={button.content}
              onChange={(e) => {
                setButton((prev) => ({
                  ...prev,
                  content: e.target.value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buttonLink">链接</Label>
            <Input
              id="buttonLink"
              value={button.link}
              onChange={(e) => {
                setButton((prev) => ({
                  ...prev,
                  link: e.target.value,
                }));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="buttonTextSize">字号(px)</Label>
              <Input
                id="buttonTextSize"
                type="number"
                min="10"
                value={Number(button.style.fontSize)}
                onChange={(e) => {
                  setButton((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      fontSize: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonTextColor">文字颜色</Label>
              <Input
                id="buttonTextColor"
                type="color"
                value={button.style.color}
                onChange={(e) =>
                  setButton((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      color: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonBgColor">背景色</Label>
              <Input
                id="buttonBgColor"
                type="color"
                value={button.style.backgroundColor}
                onChange={(e) =>
                  setButton((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      backgroundColor: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonRadius">圆角(px)</Label>
              <Input
                id="buttonRadius"
                value={button.style.borderRadius}
                onChange={(e) =>
                  setButton((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      borderRadius: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonWidth">宽度(px)</Label>
              <Input
                id="buttonWidth"
                type="number"
                min="60"
                value={button.style.width}
                onChange={(e) =>
                  setButton((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      width: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonHeight">高度(px)</Label>
              <Input
                id="buttonHeight"
                type="number"
                min="28"
                value={button.style.height}
                onChange={(e) =>
                  setButton((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      height: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applySyncButton}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function Hero({
  element,
  sync,
  onPatchBlock,
  onAddHeroAfter,
  onRemoveHero,
  onMoveHero,
}: {
  element: HTMLElement;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: Partial<AdminHeroBlock>,
  ) => void;
  onAddHeroAfter: (blockSeq: number) => void;
  onRemoveHero: (blockSeq: number) => void;
  onMoveHero: (blockSeq: number, direction: "up" | "down") => void;
}) {
  const [activeTab, setActiveTab] = useState("0");

  if (!element) return null;
  const slides = Array.from(element.querySelectorAll(".slick-slide")).filter(
    (slide) => !(slide as HTMLElement).classList.contains("slick-cloned"),
  );
  const slideMetas = slides.map((slide, index) => {
    const node = slide.querySelector(
      "[data-block-id][data-block-seq]",
    ) as HTMLElement | null;
    return {
      tab: `${index}`,
      blockId: node?.dataset.blockId || "",
      blockSeq:
        node?.dataset.blockSeq !== undefined
          ? Number(node.dataset.blockSeq)
          : undefined,
    };
  });
  const activeMeta =
    slideMetas.find((meta) => meta.tab === activeTab) || slideMetas[0];
  const activeIndex = activeMeta
    ? slideMetas.findIndex((meta) => meta.tab === activeMeta.tab)
    : -1;
  const canMoveUp = activeIndex > 0;
  const canMoveDown = activeIndex > -1 && activeIndex < slideMetas.length - 1;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="flex items-center gap-4">
          {slides.map((slide, index) => (
            <TabsTrigger key={index} value={`${index}`}>
              {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!activeMeta || activeMeta.blockSeq === undefined}
            onClick={() => {
              if (activeMeta?.blockSeq === undefined) return;
              onAddHeroAfter(activeMeta.blockSeq);
            }}
          >
            新增
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!activeMeta || activeMeta.blockSeq === undefined}
            onClick={() => {
              if (activeMeta?.blockSeq === undefined) return;
              onRemoveHero(activeMeta.blockSeq);
            }}
          >
            删除
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={
              !activeMeta || activeMeta.blockSeq === undefined || !canMoveUp
            }
            onClick={() => {
              if (activeMeta?.blockSeq === undefined) return;
              onMoveHero(activeMeta.blockSeq, "up");
            }}
          >
            上移
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={
              !activeMeta || activeMeta.blockSeq === undefined || !canMoveDown
            }
            onClick={() => {
              if (activeMeta?.blockSeq === undefined) return;
              onMoveHero(activeMeta.blockSeq, "down");
            }}
          >
            下移
          </Button>
        </div> */}
      </div>
      {slides.map((slide, index) => (
        <TabsContent key={index} value={`${index}`}>
          <Editor element={slide} sync={sync} onPatchBlock={onPatchBlock} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
