const HEX_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/;
const COLOR_FUNC_REGEX = /\b(?:rgb|rgba|hsl|hsla|oklch|lab|lch|color)\([^)]*\)/i;

function findRawColor(str) {
  if (typeof str !== 'string') return null;
  const hexMatch = str.match(HEX_REGEX);
  if (hexMatch) return hexMatch[0];
  const funcMatch = str.match(COLOR_FUNC_REGEX);
  if (funcMatch) return funcMatch[0];
  return null;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw color literals in className and style attributes',
    },
    messages: {
      noRawColorLiteral: 'Raw color literal "{{value}}" is not allowed. Use a theme token via var(--token).',
    },
    schema: [],
  },
  create(context) {
    function checkClassNameString(str, reportNode) {
      if (typeof str !== 'string' || !str) return;
      // Extract arbitrary values inside brackets: [...]
      const bracketMatches = str.matchAll(/\[(.*?)\]/g);
      for (const match of bracketMatches) {
        const bracketContent = match[1];
        if (
          /^#[0-9a-fA-F]{3,8}$/i.test(bracketContent) ||
          /^(?:rgb|rgba|hsl|hsla|oklch|lab|lch|color)\(/i.test(bracketContent)
        ) {
          context.report({
            node: reportNode,
            messageId: 'noRawColorLiteral',
            data: {
              value: bracketContent,
            },
          });
        }
      }
    }

    function checkStylePropertyValue(valueNode, reportNode) {
      if (!valueNode) return;
      if (valueNode.type === 'Literal' && typeof valueNode.value === 'string') {
        const matched = findRawColor(valueNode.value);
        if (matched) {
          context.report({
            node: reportNode || valueNode,
            messageId: 'noRawColorLiteral',
            data: {
              value: matched,
            },
          });
        }
      } else if (valueNode.type === 'TemplateLiteral') {
        for (const quasi of valueNode.quasis) {
          if (quasi.value && typeof quasi.value.raw === 'string') {
            const matched = findRawColor(quasi.value.raw);
            if (matched) {
              context.report({
                node: reportNode || quasi,
                messageId: 'noRawColorLiteral',
                data: {
                  value: matched,
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
        if (!node.name) return;
        const attrName = node.name.name;

        if (attrName === 'className' && node.value) {
          if (node.value.type === 'Literal') {
            checkClassNameString(node.value.value, node.value);
          } else if (node.value.type === 'JSXExpressionContainer') {
            const expr = node.value.expression;
            if (expr.type === 'Literal') {
              checkClassNameString(expr.value, expr);
            } else if (expr.type === 'TemplateLiteral') {
              for (const quasi of expr.quasis) {
                if (quasi.value && typeof quasi.value.raw === 'string') {
                  checkClassNameString(quasi.value.raw, quasi);
                }
              }
            }
          }
        } else if (attrName === 'style' && node.value) {
          if (node.value.type === 'JSXExpressionContainer') {
            const expr = node.value.expression;
            if (expr.type === 'ObjectExpression') {
              for (const prop of expr.properties) {
                if (prop.type === 'Property') {
                  checkStylePropertyValue(prop.value, node);
                }
              }
            }
          }
        }
      },
    };
  },
};
