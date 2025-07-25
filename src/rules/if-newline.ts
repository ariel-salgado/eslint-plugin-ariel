import { create_eslint_rule } from '../utils'

export const RULE_NAME = 'if-newline'
export type MessageIds = 'missingIfNewline'
export type Options = []

export default create_eslint_rule<Options, MessageIds>({
    name: RULE_NAME,
    meta: {
        type: 'layout',
        docs: {
            description: 'Newline after if',
        },
        fixable: 'whitespace',
        schema: [],
        messages: {
            missingIfNewline: 'Expect newline after if',
        },
    },
    defaultOptions: [],
    create: (context) => {
        return {
            IfStatement(node) {
                if (!node.consequent)
                    return
                if (node.consequent.type === 'BlockStatement')
                    return
                if (node.test.loc.end.line === node.consequent.loc.start.line) {
                    context.report({
                        node,
                        loc: {
                            start: node.test.loc.end,
                            end: node.consequent.loc.start,
                        },
                        messageId: 'missingIfNewline',
                        fix(fixer) {
                            return fixer.replaceTextRange([node.consequent.range[0], node.consequent.range[0]], '\n')
                        },
                    })
                }
            },
        }
    },
})