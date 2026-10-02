export type SanitizeSvgResult =
  | { ok: true; svg: string; viewBox: string }
  | { ok: false; error: string };

const MAX_SVG_BYTES = 20 * 1024; // 20 KB
const MAX_ATTR_LENGTH = 4000;
const MAX_ELEMENTS = 200;

const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'mask',
  'use',
]);

const FORBIDDEN_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'image',
  'animate',
  'animatemotion',
  'animatetransform',
  'set',
  'style',
  'link',
  'meta',
]);

const ALLOWED_ATTRS = new Set([
  'viewbox',
  'xmlns',
  'xmlns:xlink',
  'width',
  'height',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'fill-rule',
  'clip-rule',
  'id',
  'class',
  'gradientunits',
  'gradienttransform',
  'offset',
  'stop-color',
  'stop-opacity',
  'clip-path',
  'mask',
  'href',
  'xlink:href',
]);

export const sanitizeSvg = (raw: string): SanitizeSvgResult => {
  if (!raw || typeof raw !== 'string') {
    return { ok: false, error: 'Conteúdo SVG vazio ou inválido.' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'Conteúdo SVG vazio.' };
  }

  // Size limit check
  const byteLength = new TextEncoder().encode(trimmed).length;
  if (byteLength > MAX_SVG_BYTES) {
    return {
      ok: false,
      error: `O arquivo SVG excede o limite máximo de 20 KB (tamanho atual: ${(byteLength / 1024).toFixed(1)} KB).`,
    };
  }

  // Quick rejection check for script or javascript
  if (/<\s*script/i.test(trimmed) || /javascript\s*:/i.test(trimmed)) {
    return {
      ok: false,
      error: 'Código executável ou tags <script> não são permitidos.',
    };
  }

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(trimmed, 'image/svg+xml');
  } catch (err) {
    return { ok: false, error: 'Erro ao analisar a estrutura do SVG.' };
  }

  // Check for DOMParser errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return {
      ok: false,
      error: `Erro de sintaxe XML no SVG: ${parseError.textContent?.slice(0, 100) || 'inválido'}`,
    };
  }

  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') {
    return {
      ok: false,
      error: 'O elemento raiz do arquivo deve ser uma tag <svg>.',
    };
  }

  // Element counter & tree traversal
  let elementCount = 0;

  const validateNode = (node: Element): string | null => {
    elementCount++;
    if (elementCount > MAX_ELEMENTS) {
      return `O SVG excede o limite de ${MAX_ELEMENTS} elementos.`;
    }

    const tagName = node.localName ? node.localName.toLowerCase() : node.nodeName.toLowerCase();

    if (FORBIDDEN_TAGS.has(tagName)) {
      return `A tag <${tagName}> é estritamente proibida por segurança.`;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      return `Elemento não suportado: <${tagName}>.`;
    }

    // Check attributes
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase();
      const attrVal = attr.value;

      // Check max attribute value length
      if (attrVal.length > MAX_ATTR_LENGTH) {
        return `O atributo '${attrName}' excede o tamanho máximo de ${MAX_ATTR_LENGTH} caracteres.`;
      }

      // Check event handlers
      if (attrName.startsWith('on')) {
        return `Atributos de eventos ('${attrName}') são estritamente proibidos.`;
      }

      // Check style attribute
      if (attrName === 'style') {
        return "O atributo 'style' não é permitido no SVG.";
      }

      // Check dangerous protocols in values
      const valLower = attrVal.toLowerCase();
      if (valLower.includes('javascript:')) {
        return "Expressões 'javascript:' são proibidas.";
      }
      if (valLower.includes('data:')) {
        return "URIs 'data:' não são permitidas.";
      }

      // Check whitelist
      if (!ALLOWED_ATTRS.has(attrName)) {
        return `Atributo '${attr.name}' não permitido.`;
      }

      // Check href on <use>
      if (attrName === 'href' || attrName === 'xlink:href') {
        if (!attrVal.startsWith('#')) {
          return `O atributo '${attr.name}' só pode referenciar âncoras internas (#id).`;
        }
      }
    }

    // Specific check for <use> element
    if (tagName === 'use') {
      const href = node.getAttribute('href') || node.getAttribute('xlink:href');
      if (!href || !href.startsWith('#')) {
        return "O elemento <use> deve conter um href interno que comece com '#'.";
      }
    }

    // Traverse children
    const children = Array.from(node.children);
    for (const child of children) {
      const err = validateNode(child);
      if (err) return err;
    }

    return null;
  };

  const validationError = validateNode(root);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Extract or compute viewBox
  let viewBox = root.getAttribute('viewBox') || root.getAttribute('viewbox') || '';

  if (!viewBox) {
    const widthAttr = root.getAttribute('width');
    const heightAttr = root.getAttribute('height');
    const w = widthAttr ? parseFloat(widthAttr) : 24;
    const h = heightAttr ? parseFloat(heightAttr) : 24;

    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      viewBox = `0 0 ${w} ${h}`;
    } else {
      viewBox = '0 0 24 24';
    }
  }

  // Ensure root has clean attributes
  root.setAttribute('viewBox', viewBox);
  if (!root.getAttribute('xmlns')) {
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const serializer = new XMLSerializer();
  const serializedSvg = serializer.serializeToString(root);

  return {
    ok: true,
    svg: serializedSvg,
    viewBox,
  };
};
