class Element {
  static camelToSnakeCase(s) {
    return s.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  static serializeAttributes(attrs) {
    const attributeList = Object.entries(attrs);
    return attributeList.length ? ` ${attributeList.map(([k, v]) => `${k}="${v}"`).join(' ')}` : '';
  }

  static serializeStyle(style) {
    const styleList = Object.entries(style);
    const styleString = styleList.map(([k, v]) => `${Element.camelToSnakeCase(k)}:${v};`).join('');
    return styleList.length ? ` style="${styleString}"` : '';
  }

  static serializeTransform(matrix) {
    const a = matrix[0][0];
    const b = matrix[1][0];
    const c = matrix[0][1];
    const d = matrix[1][1];
    const e = matrix[0][2];
    const f = matrix[1][2];
    return `matrix(${a},${b},${c},${d},${e},${f})`;
  }

  static combineTransforms(prev, next) {
    const a = prev[0][0] * next[0][0] + prev[0][1] * next[1][0] + prev[0][2] * next[2][0];
    const b = prev[0][0] * next[0][1] + prev[0][1] * next[1][1] + prev[0][2] * next[2][1];
    const c = prev[0][0] * next[0][2] + prev[0][1] * next[1][2] + prev[0][2] * next[2][2];

    const d = prev[1][0] * next[0][0] + prev[1][1] * next[1][0] + prev[1][2] * next[2][0];
    const e = prev[1][0] * next[0][1] + prev[1][1] * next[1][1] + prev[1][2] * next[2][1];
    const f = prev[1][0] * next[0][2] + prev[1][1] * next[1][2] + prev[1][2] * next[2][2];

    const g = prev[2][0] * next[0][0] + prev[2][1] * next[1][0] + prev[2][2] * next[2][0];
    const h = prev[2][0] * next[0][1] + prev[2][1] * next[1][1] + prev[2][2] * next[2][1];
    const i = prev[2][0] * next[0][2] + prev[2][1] * next[1][2] + prev[2][2] * next[2][2];

    return [
       [a, b, c],
       [d, e, f],
       [g, h, i],
    ];
  }

  constructor(tag, attrs, style) {
    this.tag = tag;
    this.attrs = attrs || {};
    this.style = style || {};
    this.transform = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    this.children = [];
    return this;
  }

  fill(color, opts = {}) {
    this.attrs.fill = color;
    if (opts.opacity) this.attrs['fill-opacity'] = opts.opacity;
    return this;
  }

  stroke(color, opts = {}) {
    this.attrs.stroke = color;
    if (opts.width) this.attrs['stroke-width'] = opts.width;
    if (opts.opacity) this.attrs['stroke-opacity'] = opts.opacity;
    if (opts.linecap) this.attrs['stroke-linecap'] = opts.linecap;
    if (opts.linejoin) this.attrs['stroke-linejoin'] = opts.linejoin;
    if (opts.dasharray) this.attrs['stroke-dasharray'] = opts.dasharray;
    return this;
  }

  opacity(value) {
    this.attrs.opacity = value;
    return this;
  }

  matrix(a, b, c, d, e, f) {
    this.transform = Element.combineTransforms(this.transform, [
      [a, c, e],
      [b, d, f],
      [0, 0, 1],
    ]);
    return this;
  }

  translate(x = 0, y = 0) {
    return this.matrix(1, 0, 0, 1, x, y);
  }

  scale(x = 1, y = 1, cx = 0, cy = 0) {
    if (cx && cy) {
      return this.matrix(x, 0, 0, y, cx - x * cx, cy - y * cy);
    } else {
      return this.matrix(x, 0, 0, y, 0, 0);
    }
  }

  rotate(angle, cx = 0, cy = 0) {
    const cos = Math.cos(angle * Math.PI / 180);
    const sin = Math.sin(angle * Math.PI / 180);

    if (cx && cy) {
      return this.translate(cx, cy).matrix(cos, sin, -sin, cos, 0, 0).translate(-cx, -cy);
    } else {
      return this.matrix(cos, sin, -sin, cos, 0, 0);
    }
  }

  attr(key, value) {
    this.attrs[key] = value;
    return this;
  }

  add(element) {
    if (element) this.children.push(element);
    return this;
  }

  remove(element) {
    this.children = this.children.filter(c => c !== element);
    return this;
  }

  theme(theme) {
    this.attrs = { ...this.attrs, ...theme.attrs };
    this.style = { ...this.style, ...theme.style };
    return this;
  }

  clip(cp) {
    return this.attr('clip-path', `url(#${cp.attrs.id})`);
  }

  mask(msk) {
    return this.attr('mask', `url(#${msk.attrs.id})`);
  }

  copy() {
    const el = new Element(this.tag, { ...this.attrs }, { ...this.style });
    el.transform = this.transform.slice();
    el.children = this.children.map(c => c.copy());
    return el;
  }

  render() {
    const attrs = {
      ...this.attrs,
      transform: Element.serializeTransform(this.transform),
    };
    const childrenCode = this.children.map(c => c.render()).join('');
    const attrsCode = Element.serializeAttributes(attrs);
    const styleCode = Element.serializeStyle(this.style);
    return `<${this.tag}${attrsCode}${styleCode}>${childrenCode}</${this.tag}>`;
  }
}

class Circle extends Element {
  constructor(cx, cy, r, attrs, style) {
    super('circle', { ...attrs, cx, cy, r }, style);
    return this;
  }
}

class Group extends Element {
  constructor(attrs, style) {
    super('g', attrs, style);
    return this;
  }
}

class Rect extends Element {
  constructor(x, y, width, height, attrs, style) {
    super('rect', { ...attrs, x, y, width, height }, style);
    return this;
  }
}

let clipPathId = 0;
class ClipPath extends Element {
  constructor() {
    super('clipPath', { id: `clipPath-${clipPathId++}` });
    return this;
  }

  render() {
    return `<defs>${super.render()}</defs>`;
  }
}

let maskId = 0;
class Mask extends Element {
  constructor() {
    super('mask', { id: `mask-${maskId++}` });
    return this;
  }

  render() {
    return `<defs>${super.render()}</defs>`;
  }
}

class Path extends Element {
  constructor(d, attrs, style) {
    super('path', { ...attrs, d: d || '' }, style);
    return this;
  }

  line(x, y, abs = true) {
    this.attrs.d += ` ${abs ? 'L' : 'l'} ${x} ${y}`;
    return this;
  }

  move(x, y, abs = true) {
    this.attrs.d += ` ${abs ? 'M' : 'm'} ${x} ${y}`;
    return this;
  }

  beizer(x1, y1, x2, y2, x, y, abs = true) {
    this.attrs.d += ` ${abs ? 'C' : 'c'} ${x1} ${y1}, ${x2} ${y2}, ${x} ${y}`;
    return this;
  }

  quadratic(x1, y1, x, y, abs = true) {
    this.attrs.d += ` ${abs ? 'Q' : 'q'} ${x1} ${y1} ${x} ${y}`;
    return this;
  }

  arc(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y, abs = true) {
    this.attrs.d += ` ${abs ? 'A' : 'a'} ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${x} ${y}`;
    return this;
  }

  close() {
    this.attrs.d += ` Z`;
    return this;
  }

  combine(other) {
    this.attrs.d += ` ${other.attrs.d}`;
    return this;
  }
}

class Theme {
  constructor(attrs, style) {
    this.attrs = attrs || {};
    this.style = style || {};
  }
}

class SVG {
  static hsla(h, s, l, a) { return `hsla(${h}, ${s}%, ${l}%, ${a})`; }
  static hsl(h, s, l) { return SVG.hsla(h, s, l, 1.0); }
  static rgba(r, g, b, a) { return `rgba(${r}, ${g}, ${b}, ${a})`; }
  static rgb(r, g, b) { return SVG.rgba(r, g, b, 1.0); }

  static ClipPath(...args) {
    return new ClipPath(...args);
  }

  static Mask(...args) {
    return new Mask(...args);
  }

  static Circle(...args) {
    return new Circle(...args);
  }

  static Group(...args) {
    return new Group(...args);
  }

  static Rect(...args) {
    return new Rect(...args);
  }

  static Path(...args) {
    return new Path(...args);
  }

  static Theme(...args) {
    return new Theme(...args);
  }

  constructor(width = 100, height = 100, attrs = {}, style = {}) {
    this.dimensions = { width, height };
    this.root = new Element('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${this.dimensions.width} ${this.dimensions.height}`,
    });

    return this.root;
  }

  render() {
    return this.root.render();
  }
}

module.exports = SVG;
