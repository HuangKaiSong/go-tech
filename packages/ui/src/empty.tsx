"use client";

import { type CSSProperties, type ReactNode } from "react";

const PRESENTED_IMAGE_SIMPLE = "simple" as const;
const PRESENTED_IMAGE_DEFAULT = "default" as const;

export interface EmptyProps {
  image?: ReactNode | typeof PRESENTED_IMAGE_SIMPLE | typeof PRESENTED_IMAGE_DEFAULT;
  imageStyle?: CSSProperties;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const SimpleImage = () => (
  <svg
    width="64"
    height="41"
    viewBox="0 0 64 41"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g transform="translate(0 1)" fill="none" fillRule="evenodd">
      <ellipse fill="#f5f5f5" cx="32" cy="33" rx="32" ry="7" />
      <g fillRule="nonzero" stroke="#d9d9d9">
        <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" />
        <path
          d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
          fill="#fafafa"
        />
      </g>
    </g>
  </svg>
);

function Empty({ image, imageStyle, description, children, className }: EmptyProps) {
  let imgNode: ReactNode;

  if (image === PRESENTED_IMAGE_SIMPLE || image === undefined) {
    imgNode = <SimpleImage />;
  } else if (image === PRESENTED_IMAGE_DEFAULT) {
    imgNode = (
      <svg width="184" height="152" viewBox="0 0 184 152" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="none" fillRule="evenodd">
          <g transform="translate(24 31.67)">
            <ellipse fillOpacity=".8" fill="#f5f5f7" cx="67.797" cy="106.89" rx="67.797" ry="12.668" />
            <path d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z" fill="#aeb8c2" />
            <path d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" fill="#f5f5f7" />
            <path d="M121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z" fill="#dce0e6" />
          </g>
        </g>
      </svg>
    );
  } else if (typeof image === "string") {
    imgNode = <img src={image} alt="" style={imageStyle} />;
  } else {
    imgNode = <span style={imageStyle}>{image as ReactNode}</span>;
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 text-gray-400 ${className ?? ""}`}>
      <div className="mb-3">{imgNode}</div>
      {description !== false && (
        <p className="text-sm text-gray-400">{description ?? "暂无数据"}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

Empty.PRESENTED_IMAGE_SIMPLE = PRESENTED_IMAGE_SIMPLE;
Empty.PRESENTED_IMAGE_DEFAULT = PRESENTED_IMAGE_DEFAULT;

export { Empty };
