import { useEffect, useRef } from "react";

const TechCursor = () => {
  const cursor = useRef(null);
  const cursorTrail = useRef(null);
  const cursorDot = useRef(null);

  // 使用 useRef 存储鼠标位置，而不是普通变量
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const cursorX = useRef(0);
  const cursorY = useRef(0);
  const trailX = useRef(0);
  const trailY = useRef(0);

  // 动画帧ID
  const animationFrameId = useRef(null);

  function handleMouseMove(e) {
    mouseX.current = e.clientX;
    mouseY.current = e.clientY;

    // 检查是否在Three.js画布上
    const target = e.target;
    if (target && target.classList.contains("three-canvas")) {
      if (cursor.current) cursor.current.style.opacity = "0";
      if (cursorTrail.current) cursorTrail.current.style.opacity = "0";
      if (cursorDot.current) cursorDot.current.style.opacity = "0";
      return;
    }

    // 显示光标
    if (cursor.current) cursor.current.style.opacity = "1";
    if (cursorTrail.current) cursorTrail.current.style.opacity = "1";
    if (cursorDot.current) cursorDot.current.style.opacity = "1";

    // 检查是否悬停在可交互元素上
    const isHovering =
      target?.closest(".nav-button") ||
      target?.closest(".social-button") ||
      target?.closest(".logo-text");

    if (isHovering) {
      if (cursor.current) {
        cursor.current.style.width = "80px";
        cursor.current.style.height = "80px";
      }
      if (cursorTrail.current) {
        cursorTrail.current.style.width = "50px";
        cursorTrail.current.style.height = "50px";
      }
      if (cursorDot.current) {
        cursorDot.current.style.width = "12px";
        cursorDot.current.style.height = "12px";
      }
    } else {
      if (cursor.current) {
        cursor.current.style.width = "60px";
        cursor.current.style.height = "60px";
      }
      if (cursorTrail.current) {
        cursorTrail.current.style.width = "40px";
        cursorTrail.current.style.height = "40px";
      }
      if (cursorDot.current) {
        cursorDot.current.style.width = "8px";
        cursorDot.current.style.height = "8px";
      }
    }
  }

  // 鼠标离开页面
  function handleMouseLeave() {
    if (cursor.current) cursor.current.style.opacity = "0";
    if (cursorTrail.current) cursorTrail.current.style.opacity = "0";
    if (cursorDot.current) cursorDot.current.style.opacity = "0";
  }

  // 鼠标进入页面
  function handleMouseEnter() {
    if (cursor.current) cursor.current.style.opacity = "1";
    if (cursorTrail.current) cursorTrail.current.style.opacity = "1";
    if (cursorDot.current) cursorDot.current.style.opacity = "1";
  }

  // 动画循环
  function animate() {
    // 平滑跟随鼠标位置
    cursorX.current += (mouseX.current - cursorX.current) * 0.15;
    cursorY.current += (mouseY.current - cursorY.current) * 0.15;

    trailX.current += (cursorX.current - trailX.current) * 0.1;
    trailY.current += (cursorY.current - trailY.current) * 0.1;

    // 更新光标位置
    if (cursor.current) {
      cursor.current.style.left = `${cursorX.current}px`;
      cursor.current.style.top = `${cursorY.current}px`;
    }

    if (cursorTrail.current) {
      cursorTrail.current.style.left = `${trailX.current}px`;
      cursorTrail.current.style.top = `${trailY.current}px`;
    }

    if (cursorDot.current) {
      cursorDot.current.style.left = `${mouseX.current}px`;
      cursorDot.current.style.top = `${mouseY.current}px`;
    }

    animationFrameId.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseenter", handleMouseEnter);

    // 开始动画
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseenter", handleMouseEnter);

      // 取消动画帧
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="tech-cursor-container">
      <div ref={cursor} className="cursor-outer" />
      <div ref={cursorTrail} className="cursor-trail" />
      <div ref={cursorDot} className="cursor-dot" />
      <style>{`
      .tech-cursor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99999;
  mix-blend-mode: screen;
}

/* 外层光晕光标 - 大光环 */
.cursor-outer {
  position: fixed;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(168, 85, 247, 0.6);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
  box-shadow:
    0 0 20px rgba(168, 85, 247, 0.5),
    0 0 40px rgba(139, 92, 246, 0.3),
    inset 0 0 20px rgba(168, 85, 247, 0.2);
  opacity: 0;
  z-index: 99998;
}

/* 添加旋转动画 */
.cursor-outer::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid transparent;
  border-top-color: rgba(168, 85, 247, 0.8);
  border-right-color: rgba(192, 132, 252, 0.6);
  border-radius: 50%;
  animation: cursorRotate 3s linear infinite;
}

.cursor-outer::after {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border: 1px solid transparent;
  border-bottom-color: rgba(139, 92, 246, 0.8);
  border-left-color: rgba(168, 85, 247, 0.6);
  border-radius: 50%;
  animation: cursorRotate 2s linear infinite reverse;
}

/* 中层轨迹光标 - 中等光环 */
.cursor-trail {
  position: fixed;
  width: 40px;
  height: 40px;
  border: 1.5px solid rgba(192, 132, 252, 0.7);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
  box-shadow:
    0 0 15px rgba(192, 132, 252, 0.4),
    0 0 30px rgba(168, 85, 247, 0.2),
    inset 0 0 15px rgba(192, 132, 252, 0.15);
  opacity: 0;
  z-index: 99997;
}

/* 内层点光标 - 小光点 */
.cursor-dot {
  position: fixed;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(192, 132, 252, 0.8) 50%,
    rgba(168, 85, 247, 0.6) 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width 0.15s ease, height 0.15s ease, opacity 0.15s ease;
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(192, 132, 252, 0.6),
    0 0 30px rgba(168, 85, 247, 0.4);
  opacity: 0;
  z-index: 99999;
}

/* 悬停在可交互元素上时的效果 */
.cursor-outer {
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, border-color 0.3s ease;
}

.cursor-trail {
  transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease;
}

.cursor-dot {
  transition: width 0.15s ease, height 0.15s ease, opacity 0.15s ease;
}

/* 旋转动画 */
@keyframes cursorRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cursor-outer {
    width: 40px;
    height: 40px;
  }

  .cursor-trail {
    width: 30px;
    height: 30px;
  }

  .cursor-dot {
    width: 6px;
    height: 6px;
  }
}

/* 隐藏默认光标 */
:global(body) {
  cursor: none !important;
}

:global(.three-canvas) {
  cursor: auto !important;
}
      `}</style>
    </div>
  );
};

export default TechCursor;
