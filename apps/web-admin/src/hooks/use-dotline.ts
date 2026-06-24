interface DotlineOptions {
  ch?: number;
  cl?: string;
  cw?: number;
  dis?: number;
  dom?: string;
  ds?: number;
  r?: number;
}

interface Dot {
  ax: number;
  ay: number;
  label?: string;
  x: number | null;
  y: number | null;
}

// requestAnimationFrame控制canvas动画
const RAF = (window.requestAnimationFrame ||
  (window as any).webkitRequestAnimationFrame ||
  (window as any).mozRequestAnimationFrame ||
  (window as any).oRequestAnimationFrame ||
  (window as any).msRequestAnimationFrame ||
  function RAF(callback: FrameRequestCallback) {
    window.setTimeout(callback, 1000 / 60);
  }) as (callback: FrameRequestCallback) => number;

class Dotline {
  public opt: Required<DotlineOptions>;
  public c: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public dotSum: number;
  public radius: number;
  public disMax: number;
  public color: string;
  public dots: Dot[];
  public animate: () => void;
  public rafId: number | null = null;
  public running = false;

  constructor(option: DotlineOptions = {}) {
    this.opt = Dotline.extend(
      {
        dom: 'J_dotLine', // 画布id
        cw: 1000, // 画布宽
        ch: 500, // 画布高
        ds: 100, // 点的个数
        r: 0.5, // 圆点半径
        cl: '#000', // 颜色
        dis: 100 // 触发连线的距离
      },
      option
    ) as Required<DotlineOptions>;

    this.c = document.getElementById(this.opt.dom) as HTMLCanvasElement;
    if (!this.c) {
      throw new Error(`Canvas element with id "${this.opt.dom}" not found`);
    }

    this.ctx = this.c.getContext('2d')!;
    this.c.width = this.opt.cw; // canvas宽
    this.c.height = this.opt.ch; // canvas高
    this.dotSum = this.opt.ds; // 点的数量
    this.radius = this.opt.r; // 圆点的半径
    this.disMax = this.opt.dis * this.opt.dis; // 点与点触发连线的间距
    this.color = Dotline.color2rgb(this.opt.cl); // 设置粒子线颜色
    this.dots = [];

    // 增加鼠标效果
    const mousedot: Dot = {
      x: null,
      y: null,
      label: 'mouse',
      ax: 0,
      ay: 0
    };

    this.c.addEventListener('mousemove', (e: MouseEvent) => {
      mousedot.x = e.clientX - this.c.offsetLeft;
      mousedot.y = e.clientY - this.c.offsetTop;
    });

    this.c.addEventListener('mouseout', () => {
      mousedot.x = null;
      mousedot.y = null;
    });

    // 控制动画
    this.animate = () => {
      if (!this.running) {
        return;
      }
      this.ctx.clearRect(0, 0, this.c.width, this.c.height);
      this.drawLine([mousedot, ...this.dots]);
      this.rafId = RAF(this.animate);
    };
  }

  // 合并配置项，es6直接使用obj.assign();
  public static extend<T extends object>(o: T, e: Partial<T>): T {
    for (const key in e) {
      if (e[key] !== undefined && e[key] !== null) {
        (o as any)[key] = e[key];
      }
    }
    return o;
  }

  // 设置线条颜色
  public static color2rgb(colorStr: string): string {
    let blue: number | null = null,
      green: number | null = null,
      red: number | null = null;
    const cstr = colorStr.toLowerCase(); // 变小写
    const cReg = /^#[0-9a-fA-F]{3,6}$/; // 确定是16进制颜色码
    if (cstr && cReg.test(cstr)) {
      let formattedColorStr = cstr;
      if (cstr.length === 4) {
        let cstrnew = '#';
        for (let i = 1; i < 4; i += 1) {
          cstrnew += cstr.slice(i, i + 1).concat(cstr.slice(i, i + 1));
        }
        formattedColorStr = cstrnew;
      }
      red = Number.parseInt(`0x${formattedColorStr.slice(1, 3)}`, 16);
      green = Number.parseInt(`0x${formattedColorStr.slice(3, 5)}`, 16);
      blue = Number.parseInt(`0x${formattedColorStr.slice(5, 7)}`, 16);
    }
    return `${red},${green},${blue}`;
  }

  // 画点
  public addDots(): void {
    for (let i = 0; i < this.dotSum; i += 1) {
      // 参数
      const dot: Dot = {
        x: Math.floor(Math.random() * this.c.width) - this.radius,
        y: Math.floor(Math.random() * this.c.height) - this.radius,
        ax: (Math.random() * 2 - 1) / 1.5,
        ay: (Math.random() * 2 - 1) / 1.5
      };
      this.dots.push(dot);
    }
  }

  // 点运动
  public move(dot: Dot): void {
    if (dot.x === null || dot.y === null) return;
    const x = dot.x + dot.ax;
    const y = dot.y + dot.ay;
    // 点碰到边缘返回
    dot.ax *= x > this.c.width - this.radius || x < this.radius ? -1 : 1;
    dot.ay *= y > this.c.height - this.radius || y < this.radius ? -1 : 1;
    dot.x = x;
    dot.y = y;
    // 绘制点
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.radius, 0, Math.PI * 2, true);
    this.ctx.stroke();
  }

  // 点之间画线
  public drawLine(dots: Dot[]): void {
    // 自己的思路：遍历两次所有的点，比较点之间的距离，函数的触发放在animate里
    this.dots.forEach(dot => {
      this.move(dot);
      if (dot.x === null || dot.y === null) return;
      let dotX = dot.x;
      let dotY = dot.y;
      for (let j = 0; j < dots.length; j += 1) {
        const nowDot = dots[j];
        if (nowDot !== dot && nowDot.x !== null && nowDot.y !== null) {
          const nx = nowDot.x;
          const ny = nowDot.y;
          const dx = dotX - nx; // 别的点坐标减当前点坐标
          const dy = dotY - ny;
          const dc = dx * dx + dy * dy;
          if (Math.sqrt(dc) <= Math.sqrt(this.disMax)) {
            // 如果是鼠标，则让粒子向鼠标的位置移动
            if (nowDot.label && Math.sqrt(dc) > Math.sqrt(this.disMax) / 2) {
              dotX -= dx * 0.02;
              dotY -= dy * 0.02;
            }
            const ratio = (this.disMax - dc) / this.disMax;
            this.ctx.beginPath();
            this.ctx.lineWidth = ratio / 2;
            this.ctx.strokeStyle = `rgba(${this.color}, ${Number.parseFloat((ratio + 0.2).toFixed(1))})`;
            this.ctx.moveTo(dotX, dotY);
            this.ctx.lineTo(nx, ny);
            this.ctx.stroke(); // 不描边看不出效果
          }
        }
      }
      dot.x = dotX;
      dot.y = dotY;
    });
  }

  // 开始动画
  public start(): void {
    if (this.running) return;
    this.running = true;
    this.addDots();
    setTimeout(() => {
      this.animate();
    }, 100);
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.ctx.clearRect(0, 0, this.c.width, this.c.height);
  }
}

export default Dotline;
