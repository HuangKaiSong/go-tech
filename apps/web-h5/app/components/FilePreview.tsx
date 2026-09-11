'use client';

import presetOffice from '@file-viewer/preset-office';
import FileViewer from '@file-viewer/react';

interface Props {
  file: ArrayBuffer | Blob;
  filename: string;
}

export const FilePreview = ({ file, filename }: Props) => {
  const previewObjFile =
    file instanceof ArrayBuffer
      ? new File([file], filename)
      : new File([file], 'contract.pdf', {
          type: file.type
        });

  return (
    <div className="h-dvh w-full">
      <FileViewer
        file={previewObjFile}
        filename={filename}
        options={{
          preset: [presetOffice],
          rendererMode: 'extend',
          theme: 'light',
          toolbar: { position: 'bottom-right', exportHtml: false, print: false },
          archive: {
            cache: true,
            workerTimeoutMs: 30000
          }
        }}
      />
    </div>
  );
};
