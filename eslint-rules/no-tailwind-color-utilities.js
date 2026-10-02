const COLOR_NAMES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'black', 'white',
];

const COLOR_PREFIXES = [
  'text', 'bg', 'border', 'ring', 'outline', 'divide', 'shadow',
  'from', 'via', 'to', 'fill', 'stroke', 'accent', 'caret', 'decoration', 'placeholder',
];

const NON_PALETTE_KEYWORDS = [
  'transparent', 'current', 'inherit', 'initial', 'auto',
];

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Tailwind default color palette utilities',
    },
    messages: {
      noTailwindColor: 'Tailwind color utility "{{token}}" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
    },
    schema: [],
  },
  create(context) {
    const checkedNodes = new Set();

    function checkTokens(str, node) {
      if (typeof str !== 'string' || !str) return;
      if (checkedNodes.has(node)) return;
      checkedNodes.add(node);

      const tokens = str.trim().split(/\s+/);
      for (const rawToken of tokens) {
        if (!rawToken) continue;
        const lastColonIndex = rawToken.lastIndexOf(':');
        const token = lastColonIndex >= 0 ? rawToken.slice(lastColonIndex + 1) : rawToken;

        for (const prefix of COLOR_PREFIXES) {
          if (token.startsWith(prefix + '-')) {
            const remainder = token.slice(prefix.length + 1);
            if (remainder.startsWith('[')) {
              break;
            }
            const firstSegment = remainder.split(/[-/]/)[0];
            if (NON_PALETTE_KEYWORDS.includes(firstSegment)) {
              break;
            }
            if (COLOR_NAMES.includes(firstSegment)) {
              context.report({
                node,
                messageId: 'noTailwindColor',
                data: {
                  token: rawToken,
                },
              });
              break;
            }
          }
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === 'className' && node.value) {
          if (node.value.type === 'Literal') {
            checkTokens(node.value.value, node.value);
          }
        }
      },
      Literal(node) {
        if (typeof node.value !== 'string') return;
        if (node.parent) {
          if (
            node.parent.type === 'ImportDeclaration' ||
            node.parent.type === 'ExportNamedDeclaration' ||
            node.parent.type === 'ExportAllDeclaration'
          ) {
            return;
          }
        }
        checkTokens(node.value, node);
      },
      TemplateElement(node) {
        if (node.value && typeof node.value.raw === 'string') {
          checkTokens(node.value.raw, node);
        }
      },
    };
  },
};
