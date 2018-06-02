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

  constructor(tag, attrs = {}, style = {}) {
    this.tag = tag;
    this.attrs = attrs;
    this.style = style;
    this.children = [];
    return this;
  }

  attr(key, value) {
    this.attrs[key] = value;
    return this;
  }

  add(element) {
    this.children.push(element);
    return this;
  }

  remove(element) {
    this.children = this.children.filter(c => c !== element);
    return this;
  }

  render(compress = false) {
    const code = `
      <${this.tag}${Element.serializeAttributes(this.attrs)}>${this.children.map(c => c.render(compress)).join(' ')}</${this.tag}>
    `;

    return code.trim();
  }
}

class Circle extends Element {
  constructor(cx, cy, r, attrs = {}, style = {}) {
    super('circle', { ...attrs, cx, cy, r }, style);
    return this;
  }
}

class Group extends Element {
  constructor(attrs = {}, style = {}) {
    super('g', attrs, style);
    return this;
  }
}

class SVG {
  static Circle(cx, cy, r, attrs, style) {
    return new Circle(cx, cy, r, attrs, style);
  }

  static Group(attrs = {}, style = {}) {
    return new Group(attrs, style);
  }

  constructor(width = 100, height = 100) {
    this.dimensions = { width, height };
    this.root = new Element('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${this.dimensions.width} ${this.dimensions.height}`,
    });

    return this.root;
  }

  render(compress = false) {
    return this.root.render(compress);
  }
}

module.exports = SVG;
