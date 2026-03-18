/* eslint-disable react-hooks/rules-of-hooks */
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileUpload,
  Input,
  Label,
  Textarea,
  UploadedFile,
} from "@go-tech-frontend/ui";
import { useAsyncEffect } from "ahooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { BlockType, CommonBlock } from "./type";
import { fetchAndConvertToFile } from "./utils";

export default function Common({
  element,
  sync,
  onPatchBlock,
}: {
  element: HTMLElement;
  sync: (payload: Record<string, unknown>) => void;
  onPatchBlock: (
    blockId: string,
    blockSeq: number | undefined,
    patch: Partial<CommonBlock>,
  ) => void;
}) {
  if (!element) return null;

  const role = element.dataset.blockRole || "";
  const blockId = element.dataset.blockId || "common-info";
  const blockSeq = element.dataset.blockSeq
    ? Number(element.dataset.blockSeq)
    : undefined;
  const targetRole =
    role === "phone" ? "phoneValue" : role === "email" ? "emailValue" : role;

  const isLogo = role === "logo";
  const targetTextElement = useMemo(() => {
    if (targetRole === role) return element;
    const found = element.querySelector(
      `[data-block-role="${targetRole}"]`,
    ) as HTMLElement | null;
    return found || element;
  }, [element, role, targetRole]);
  const initialText = useMemo(
    () => targetTextElement.textContent || "",
    [targetTextElement],
  );
  const initialSrc = useMemo(
    () => (element as HTMLImageElement).getAttribute("src") || "",
    [element],
  );

  const [text, setText] = useState(initialText);
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const fileRef = useRef<File | null>(null);
  const h5Host = import.meta.env.VITE_H5_SITE_URL as string | undefined;

  useAsyncEffect(async () => {
    if (!isLogo || !initialSrc) return;
    let prevSrc = initialSrc;
    try {
      fileRef.current = await fetchAndConvertToFile(initialSrc);
      prevSrc = URL.createObjectURL(fileRef.current);
    } catch (error) {
      fileRef.current = new File([], "logo.webp", { type: "image/webp" });
    }
    const h5SiteUrl = import.meta.env.VITE_H5_SITE_URL;

    if (initialSrc.startsWith("/")) {
      prevSrc = `${h5SiteUrl}${initialSrc}`;
    }

    setFileList([
      {
        id: `${Date.now()}`,
        file: fileRef.current,
        previewUrl: prevSrc,
        status: "success",
        progress: 100,
        url: initialSrc,
      },
    ]);
  }, [isLogo, initialSrc]);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read local file"));
      reader.readAsDataURL(file);
    });

  const applyText = () => {
    sync({
      type: "UPDATE_ELEMENT_TEXT",
      text,
      block: { id: blockId, role: targetRole, seq: blockSeq },
    });
    onPatchBlock(blockId, blockSeq, {
      type: BlockType.Common,
      values: { [targetRole]: text },
    });
  };

  const applyLogo = async () => {
    const file = fileList.find((f) => f.status === "success");
    const rawUrl =
      file?.url ||
      (file as UploadedFile & { fileUrl?: string; path?: string })?.fileUrl ||
      (file as UploadedFile & { fileUrl?: string; path?: string })?.path ||
      file?.previewUrl;
    let url =
      rawUrl && rawUrl.startsWith("/") && h5Host
        ? `${h5Host.replace(/\/$/, "")}${rawUrl}`
        : rawUrl;
    if (url?.startsWith("blob:") && file?.file) {
      try {
        url = await fileToDataUrl(file.file);
      } catch {
        // keep original url if conversion fails
      }
    }
    if (!url) return;
    sync({
      type: "UPDATE_ELEMENT_ATTR",
      attr: "src",
      value: url,
      block: { id: blockId, role, seq: blockSeq },
    });
    onPatchBlock(blockId, blockSeq, {
      type: BlockType.Common,
      image: url,
      values: { [role]: url },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>通用模块 ({role || "common"})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLogo ? (
          <>
            <Label>Logo</Label>
            <FileUpload
              maxCount={1}
              list={fileList}
              uploadUrl="/api/pms-resource/web-back/minio/upload"
              onChange={(files) => setFileList(files)}
            />
            <Button onClick={applyLogo}>应用</Button>
          </>
        ) : (
          <>
            <Label>内容</Label>
            {role.includes("phone") || role.includes("email") ? (
              <Input value={text} onChange={(e) => setText(e.target.value)} />
            ) : (
              <Textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}
            <Button onClick={applyText}>应用</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
