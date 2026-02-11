interface DotlineOptions {
  dom?: string;
  cw?: number;
  ch?: number;
  ds?: number;
  r?: number;
  cl?: string;
  dis?: number;
}

interface Dot {
  x: number | undefined;
  y: number | undefined;
  ax: number;
  ay: number;
  label?: string;
}

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
    this.opt = this.extend(
      {
        dom: 'J_dotLine', // 画布id
        cw: 1000, // 画布宽
        ch: 500, // 画布高
        ds: 100, // 点的个数
        r: 0.5, // 圆点半径
        cl: '#000', // 颜色
        dis: 100, // 触发连线的距离
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
    this.color = this.color2rgb(this.opt.cl); // 设置粒子线颜色
    this.dots = [];

    // requestAnimationFrame控制canvas动画
    const RAF =
      (window.requestAnimationFrame ||
        (window as any).webkitRequestAnimationFrame ||
        (window as any).mozRequestAnimationFrame ||
        (window as any).oRequestAnimationFrame ||
        (window as any).msRequestAnimationFrame ||
        function (callback: FrameRequestCallback) {
          window.setTimeout(callback, 1000 / 60);
        }) as (callback: FrameRequestCallback) => number;

    // 增加鼠标效果
    const mousedot: Dot = {
      x: null as any,
      y: null as any,
      label: 'mouse',
      ax: 0,
      ay: 0
    };

    this.c.onmousemove = (e: MouseEvent) => {
      mousedot.x = e.clientX - this.c.offsetLeft;
      mousedot.y = e.clientY - this.c.offsetTop;
    };

    this.c.onmouseout = function (e: MouseEvent) {
      mousedot.x = null as any;
      mousedot.y = null as any;
    };

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
  public extend<T extends object>(o: T, e: Partial<T>): T {
    for (const key in e) {
      if (e[key] != null) {
        (o as any)[key] = e[key];
      }
    }
    return o;
  }

  // 设置线条颜色
  public color2rgb(colorStr: string): string {
    let red: number | null = null,
      green: number | null = null,
      blue: number | null = null;
    const cstr = colorStr.toLowerCase(); // 变小写
    const cReg = /^#[0-9a-fA-F]{3,6}$/; // 确定是16进制颜色码
    if (cstr && cReg.test(cstr)) {
      let formattedColorStr = cstr;
      if (cstr.length === 4) {
        let cstrnew = '#';
        for (let i = 1; i < 4; i++) {
          cstrnew += cstr.slice(i, i + 1).concat(cstr.slice(i, i + 1));
        }
        formattedColorStr = cstrnew;
      }
      red = parseInt('0x' + formattedColorStr.slice(1, 3));
      green = parseInt('0x' + formattedColorStr.slice(3, 5));
      blue = parseInt('0x' + formattedColorStr.slice(5, 7));
    }
    return `${red},${green},${blue}`;
  }

  // 画点
  public addDots(): void {
    for (let i = 0; i < this.dotSum; i++) {
      // 参数
      const dot: Dot = {
        x: Math.floor(Math.random() * this.c.width) - this.radius,
        y: Math.floor(Math.random() * this.c.height) - this.radius,
        ax: (Math.random() * 2 - 1) / 1.5,
        ay: (Math.random() * 2 - 1) / 1.5,
      };
      this.dots.push(dot);
    }
  }

  // 点运动
  public move(dot: Dot): void {
    dot.x += dot.ax;
    dot.y += dot.ay;
    // 点碰到边缘返回
    dot.ax *= dot.x > this.c.width - this.radius || dot.x < this.radius ? -1 : 1;
    dot.ay *= dot.y > this.c.height - this.radius || dot.y < this.radius ? -1 : 1;
    // 绘制点
    this.ctx.beginPath();
    this.ctx.arc(dot.x, dot.y, this.radius, 0, Math.PI * 2, true);
    this.ctx.stroke();
  }

  // 点之间画线
  public drawLine(dots: Dot[]): void {
    // 自己的思路：遍历两次所有的点，比较点之间的距离，函数的触发放在animate里
    this.dots.forEach((dot) => {
      this.move(dot);
      for (let j = 0; j < dots.length; j++) {
        const nowDot = dots[j];
        if (
          nowDot === dot ||
          nowDot.x == null ||
          nowDot.y == null
        )
          continue; // continue跳出当前循环开始新的循环
        const dx = dot.x - nowDot.x; // 别的点坐标减当前点坐标
        const dy = dot.y - nowDot.y;
        const dc = dx * dx + dy * dy;
        if (Math.sqrt(dc) > Math.sqrt(this.disMax)) continue;
        // 如果是鼠标，则让粒子向鼠标的位置移动
        if (nowDot.label && Math.sqrt(dc) > Math.sqrt(this.disMax) / 2) {
          dot.x -= dx * 0.02;
          dot.y -= dy * 0.02;
        }
        const ratio = (this.disMax - dc) / this.disMax;
        this.ctx.beginPath();
        this.ctx.lineWidth = ratio / 2;
        this.ctx.strokeStyle = `rgba(${this.color}, ${parseFloat(
          (ratio + 0.2).toFixed(1)
        )})`;
        this.ctx.moveTo(dot.x, dot.y);
        this.ctx.lineTo(nowDot.x, nowDot.y);
        this.ctx.stroke(); // 不描边看不出效果
      }
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
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.ctx.clearRect(0, 0, this.c.width, this.c.height);
  }
}

export default Dotline;
