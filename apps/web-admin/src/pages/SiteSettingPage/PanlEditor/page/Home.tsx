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
import { RefreshCcwIcon } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { fetchAndConvertToFile, rgbToHex } from "../utils";

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

export default function Home({
  element,
  sync,
  onPatchBlock,
}: {
  element: HTMLElement;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: any,
  ) => void;
}) {
  if (!element) return null;

  const role = element.dataset.blockRole || "";
  const blockId = element.dataset.blockId || "home-section";

  return (
    <Card>
      <CardHeader>
        <CardTitle>首页 ({role || "Section"})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {blockId.includes("section") ? (
          <Section
            key={element.outerHTML}
            element={element}
            sync={sync}
            onPatchBlock={onPatchBlock}
          />
        ) : null}

        {blockId.includes("audiences") ? (
          <Audiences
            key={element.outerHTML}
            element={element}
            sync={sync}
            onPatchBlock={onPatchBlock}
          />
        ) : null}

        {blockId.includes("testimonial") ? (
          <Testimonial
            key={element.outerHTML}
            element={element}
            sync={sync}
            onPatchBlock={onPatchBlock}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function Section({
  element,
  sync,
  onPatchBlock,
}: {
  element: HTMLElement;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: any,
    type?: string,
  ) => void;
}) {
  const role = element.dataset.blockRole || "";
  const blockId = element.dataset.blockId || "home-section";
  const originTitle = element.querySelector('[data-block-role="title"]');
  const originLine = element.querySelector('[data-block-role="line"]');
  const originIntro = element.querySelector('[data-block-role="intro"]');

  const titleInfo = {
    content: originTitle.textContent || "",
    style: {
      fontSize: getStyleValue(originTitle, "font-size", "fontSize").replace(
        "px",
        "",
      ),
      color: rgbToHex(getStyleValue(originTitle, "color")),
    },
  };

  const lineInfo = {
    width: getStyleValue(originLine, "width").replace("px", ""),
    height: getStyleValue(originLine, "height").replace("px", ""),
    backgroundColor: rgbToHex(getStyleValue(originLine, "background-color")),
    bottom: getStyleValue(originLine, "bottom").replace("px", ""),
  };

  const introInfo = {
    content: originIntro?.textContent || "",
    style: {
      fontSize: getStyleValue(originIntro, "font-size", "fontSize").replace(
        "px",
        "",
      ),
      color: rgbToHex(getStyleValue(originIntro, "color")),
    },
  };

  const [title, setTitle] = useState(titleInfo);
  const [line, setLine] = useState(lineInfo);
  const [intro, setIntro] = useState(introInfo);

  const applyIntro = () => {
    const style: CSSProperties = {
      fontSize: intro.style.fontSize ? Number(intro.style.fontSize) : "1rem",
      color: intro.style.color || undefined,
    };
    sync({
      type: "UPDATE_ELEMENT_TEXT",
      text: intro.content,
      block: { id: blockId, role: "intro" },
    });
    sync({
      type: "UPDATE_ELEMENT_STYLE",
      style,
      block: { id: blockId, role: "intro" },
    });
    onPatchBlock(
      blockId,
      undefined,
      {
        intro: intro.content,
        introStyle: style,
      },
      "section",
    );
  };

  const applyLine = () => {
    const lineStyle: CSSProperties = {
      background: line.backgroundColor || undefined,
      height: line.height ? Number(line.height) : "1px",
      width: line.width ? Number(line.width) : "100%",
      bottom: line.bottom ? Number(line.bottom) : undefined,
    };

    sync({
      type: "UPDATE_ELEMENT_STYLE",
      style: lineStyle,
      block: { id: blockId, role: "line" },
    });

    onPatchBlock(
      blockId,
      undefined,
      {
        lineStyle,
      },
      "section",
    );
  };

  const applyTitle = () => {
    const style: CSSProperties = {
      fontSize: title.style.fontSize ? Number(title.style.fontSize) : "1rem",
      color: title.style.color || undefined,
    };
    sync({
      type: "UPDATE_ELEMENT_TEXT",
      text: title.content,
      block: { id: blockId, role: "title" },
    });
    sync({
      type: "UPDATE_ELEMENT_STYLE",
      style,
      block: { id: blockId, role: "title" },
    });

    onPatchBlock(
      blockId,
      undefined,
      {
        title: title.content,
        titleStyle: style,
      },
      "section",
    );
  };

  return (
    <div>
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
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applyTitle}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>分割線</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="bgColor">颜色</Label>
            <Input
              id="bgColor"
              type="color"
              value={line.backgroundColor}
              onChange={(e) => {
                setLine((prev) => ({
                  ...prev,
                  backgroundColor: e.target.value,
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buttonWidth">宽度(px)</Label>
            <Input
              id="buttonWidth"
              type="number"
              min="0"
              value={Number(line.width)}
              onChange={(e) =>
                setLine((prev) => ({
                  ...prev,
                  width: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buttonHeight">高度(px)</Label>
            <Input
              id="buttonHeight"
              type="number"
              min="0"
              value={Number(line.height)}
              onChange={(e) =>
                setLine((prev) => ({
                  ...prev,
                  height: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bottom">位置(px)</Label>
            <Input
              id="bottom"
              type="number"
              value={Number(line.bottom)}
              onChange={(e) =>
                setLine((prev) => ({
                  ...prev,
                  bottom: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applyLine}>
              应用
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>引言样式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="textContent">内容</Label>
            <Textarea
              id="textContent"
              rows={3}
              placeholder="输入文字"
              value={intro.content}
              onChange={(e) => {
                setIntro((prev) => ({
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
                value={Number(intro.style.fontSize)}
                onChange={(e) => {
                  setIntro((prev) => ({
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
                value={intro.style.color}
                onChange={(e) => {
                  setIntro((prev) => ({
                    ...prev,
                    style: {
                      ...prev.style,
                      color: e.target.value,
                    },
                  }));
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={applyIntro}>
                应用
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Audiences({
  element,
  sync,
  onPatchBlock,
}: {
  element: HTMLElement;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: any,
    type?: string,
  ) => void;
}) {
  const audiences = Array.from(
    element.querySelectorAll('[data-block-role="audiences"]'),
  );
  type AudienceItem = {
    blockId: string;
    sort: string;
    title: string;
    description: string;
    initialSrc: string;
    prevSrc: string;
    fileList?: UploadedFile[];
  };
  const audiencesInfo: AudienceItem[] = audiences.map((audience) => {
    const blockId = (audience as HTMLElement).dataset.blockId;
    const sort = (audience as HTMLElement).dataset.blockSeq;

    const title =
      audience.querySelector('[data-block-role="title"]')?.textContent || "";
    const description =
      audience.querySelector('[data-block-role="description"]')?.textContent ||
      "";

    const initialSrc =
      (
        audience.querySelector('[data-block-role="img"]') as HTMLImageElement
      )?.getAttribute("src") || "";
    let prevSrc = initialSrc;

    if (initialSrc.startsWith("/_next")) {
      prevSrc = `/h5-hook${initialSrc}`;
    }

    return {
      blockId,
      sort,
      title,
      description,
      initialSrc,
      prevSrc,
    };
  });
  const initialAudiences = useRef<AudienceItem[]>([]);
  const [audienceItems, setAudienceItems] = useState(audiencesInfo);

  const applySyncTarget = () => {
    const initialMap = new Map(
      initialAudiences.current.map((item) => [
        `${item.blockId || ""}-${item.sort || ""}`,
        item,
      ]),
    );

    audienceItems.forEach((audience) => {
      const key = `${audience.blockId || ""}-${audience.sort || ""}`;
      const initial = initialMap.get(key);

      if (audience.title !== initial?.title) {
        sync({
          type: "UPDATE_ELEMENT_TEXT",
          text: audience.title,
          block: { id: initial.blockId, role: "title", seq: initial.sort },
        });
      }

      if (audience.description !== initial?.description) {
        sync({
          type: "UPDATE_ELEMENT_TEXT",
          text: audience.description,
          block: {
            id: audience.blockId,
            role: "description",
            seq: audience.sort,
          },
        });
      }

      if (audience.initialSrc && audience.initialSrc !== initial?.initialSrc) {
        sync({
          type: "UPDATE_ELEMENT_ATTR",
          attr: "src",
          value: audience.initialSrc,
          block: { id: audience.blockId, role: "img", seq: audience.sort },
        });
      }
    });

    const targetAudiences = audienceItems
      .map((item) => {
        delete item.fileList;
        return item;
      })
      .sort((a, b) => Number(b.sort) - Number(a.sort));

    onPatchBlock(
      "home-audiences",
      undefined,
      {
        audiences: targetAudiences,
      },
      "audiences",
    );
  };

  useEffect(() => {
    let cancelled = false;

    const loadFiles = async () => {
      const nextItems = await Promise.all(
        audiencesInfo.map(async (audience) => {
          if (!audience.initialSrc) return audience;

          try {
            const file = await fetchAndConvertToFile(audience.initialSrc);
            const fileList: UploadedFile[] = [
              {
                file,
                previewUrl: audience.prevSrc,
                status: "success",
                progress: 100,
                url: audience.initialSrc,
                id: audience.prevSrc || audience.initialSrc,
              },
            ];

            return {
              ...audience,
              fileList,
            };
          } catch {
            return audience;
          }
        }),
      );

      if (!cancelled) {
        setAudienceItems(nextItems);
        initialAudiences.current = JSON.parse(JSON.stringify(nextItems));
      }
    };

    void loadFiles();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  return (
    <Tabs>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="flex items-center gap-4">
          {audiences.map((audience, index) => {
            const value = (audience as HTMLElement).dataset.blockSeq;

            return (
              <TabsTrigger key={value} value={value}>
                {index + 1}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <Button onClick={applySyncTarget}>
          <RefreshCcwIcon />
        </Button>
      </div>
      {audienceItems.map((audience) => {
        return (
          <TabsContent
            key={audience.sort}
            value={`${audience.sort}`}
            className="space-y-2"
          >
            <div className="space-y-2">
              <Label htmlFor="backgroundImageUrl">背景图</Label>
              <FileUpload
                maxCount={1}
                uploadUrl="/api/pms-resource/web-back/minio/upload"
                list={audience.fileList}
                onChange={(files) => {
                  audience.fileList = files;
                  const file = files.find((f) => f.status === "success");
                  if (!file) {
                    audience.fileList = [];
                  } else {
                    audience.prevSrc = file.previewUrl;
                    audience.initialSrc = file.url;
                  }

                  setAudienceItems((prev) => {
                    return Array.from(new Set([...prev, ...audienceItems]));
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">標題</Label>
              <Input
                id="title"
                placeholder="输入文字"
                value={audience.title}
                onChange={(e) => {
                  audience.title = e.target.value;
                  setAudienceItems((prev) => {
                    return Array.from(new Set([...prev, ...audienceItems]));
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={audience.description}
                onChange={(e) => {
                  audience.description = e.target.value;
                  setAudienceItems((prev) => {
                    return Array.from(new Set([...prev, ...audienceItems]));
                  });
                }}
                rows={3}
                placeholder="输入文字"
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function Testimonial({
  element,
  sync,
  onPatchBlock,
}: {
  element: HTMLElement;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: any,
    type?: string,
  ) => void;
}) {
  const titleContent =
    element.querySelector('[data-block-role="title"]')?.textContent || "";
  const descriptionContent =
    element.querySelector('[data-block-role="description"]')?.textContent || "";
  const itemsContent =
    element.querySelector('[data-block-role="items"]')?.childNodes || [];
  const initialImage =
    element.querySelector('[data-block-role="image"]').getAttribute("src") ||
    "";

  const [title, setTitle] = useState(titleContent);
  const [description, setDescription] = useState(descriptionContent);
  const [items, setItems] = useState(() => {
    return Array.from(itemsContent).map((node) => {
      const text = (node as HTMLElement).textContent || "";
      return text.replace(/^\s*-\s*/, "");
    });
  });

  const [fileList, setFileList] = useState([]);

  useAsyncEffect(async () => {
    let prevSrc = initialImage;
    const file = await fetchAndConvertToFile(initialImage);
    if (initialImage.startsWith("/_next")) {
      prevSrc = `/h5-hook${prevSrc}`;
    }

    setFileList([
      {
        file,
        previewUrl: prevSrc,
        status: "success",
        progress: 100,
        url: initialImage,
        id: prevSrc || initialImage,
      },
    ]);
  }, [initialImage]);

  const applySync = () => {
    const file = fileList?.find((item) => item.status === "success");
    const patchData: {
      title: string;
      description: string;
      items: string[];
      image?: string;
    } = {
      title,
      description,
      items,
    };

    sync({
      type: "UPDATE_ELEMENT_TEXT",
      text: patchData.title,
      block: { id: "home-testimonial", role: "title" },
    });
    sync({
      type: "UPDATE_ELEMENT_TEXT",
      text: patchData.description,
      block: { id: "home-testimonial", role: "description" },
    });

    let el = ``;
    patchData.items.map((item) => {
      el += `<div>- ${item}</div>`;
    });

    sync({
      type: "SET_ELEMENT",
      element: el,
      block: { id: "home-testimonial", role: "items" },
    });

    if (file) {
      patchData.image = file.url;
      sync({
        type: "UPDATE_ELEMENT_ATTR",
        attr: "src",
        value: file.url,
        block: { id: "home-testimonial", role: "image" },
      });
    }

    // 准备 blocks
    onPatchBlock("home-testimonial", undefined, patchData, "testimonial");
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-lg">
          标题
        </Label>
        <Textarea
          id="title"
          rows={3}
          placeholder="输入文字"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-lg" htmlFor="description">
          描述
        </Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="输入文字"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="textContent" className="text-lg">
          项目
        </Label>
        <div className="space-y-1">
          {items.map((item, index) => (
            <Textarea
              key={index}
              cols={1}
              placeholder="输入文字"
              value={item}
              onChange={(e) => {
                const value = e.target.value;
                setItems((prev) => {
                  const next = [...prev];
                  next[index] = value;
                  return next;
                });
              }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image" className="text-lg">
          图
        </Label>
        <FileUpload
          maxCount={1}
          uploadUrl="/api/pms-resource/web-back/minio/upload"
          list={fileList}
          onChange={(files) => {
            setFileList(files);
          }}
        />
      </div>
      <div className="flex">
        <Button className="flex-1" onClick={applySync}>
          应用
        </Button>
      </div>
    </>
  );
}
