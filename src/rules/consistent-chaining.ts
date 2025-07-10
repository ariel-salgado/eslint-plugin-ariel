import type { TSESTree } from '@typescript-eslint/utils';

import { create_eslint_rule } from '../utils';

export const RULE_NAME = 'consistent-chaining';

export type MessageIds = 'should_wrap' | 'should_not_wrap';
export type Options = [
  {
    allowLeadingPropertyAccess?: boolean
  },
]

export default create_eslint_rule<Options, MessageIds>({
    name: RULE_NAME,
    meta: {
        type: 'layout',
        docs: {
            description: 'Having line breaks styles to object, array and named imports',
        },
        fixable: 'whitespace',
        schema: [
            {
                type: 'object',
                properties: {
                    allowLeadingPropertyAccess: {
                        type: 'boolean',
                        description: 'Allow leading property access to be on the same line',
                        default: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            should_wrap: 'Should have line breaks between items, in node {{name}}',
            should_not_wrap: 'Should not have line breaks between items, in node {{name}}',
        },
    },
    defaultOptions: [
        {
            allowLeadingPropertyAccess: true,
        },
    ],
    create: (context) => {
        const known_root = new WeakSet<any>()

        const {
            allowLeadingPropertyAccess: allow_leading_property_access = true,
        } = context.options[0] || {}

        return {
            MemberExpression(node) {
                let root: TSESTree.Node = node;

                while (root.parent && (root.parent.type === 'MemberExpression' || root.parent.type === 'CallExpression'))
                    root = root.parent
                
                if (known_root.has(root))
                    return
                
                known_root.add(root)

                const members: TSESTree.MemberExpression[] = []
                let current: TSESTree.Node | undefined = root
                
                while (current) {
                    switch (current.type) {
                        case 'MemberExpression': {
                        if (!current.computed)
                            members.unshift(current)
                            current = current.object
                            break
                        }
                        case 'CallExpression': {
                            current = current.callee
                            break
                        }
                        case 'TSNonNullExpression': {
                            current = current.expression
                            break
                        }
                        default: {
                            current = undefined
                            break
                        }
                    }
                }

                let leading_property_access = allow_leading_property_access;
                let mode: 'single' | 'multi' | null = null;

                members.forEach((m) => {
                    const token = context.sourceCode.getTokenBefore(m.property)!
                    const token_before = context.sourceCode.getTokenBefore(token)!
                    const current_mode: 'single' | 'multi' = token.loc.start.line === token_before.loc.end.line ? 'single' : 'multi'
                    const object = m.object.type === 'TSNonNullExpression' ? m.object.expression : m.object
                if (
                    leading_property_access
                    && (object.type === 'ThisExpression' || object.type === 'Identifier' || object.type === 'MemberExpression' || object.type === 'Literal')
                    && current_mode === 'single'
                ) {
                    return;
                }

                leading_property_access = false;

                if (mode == null) {
                    mode = current_mode
                    return;
                }

                if (mode !== current_mode) {
                    context.report({
                        messageId: mode === 'single' ? 'should_not_wrap' : 'should_wrap',
                        loc: token.loc,
                        data: {
                            name: root.type,
                        },
                        fix(fixer) {
                            if (mode === 'multi')
                                return fixer.insertTextAfter(token_before, '\n')
                            else
                                return fixer.removeRange([token_before.range[1], token.range[0]])
                        },
                    })
                }
                })
            },
        }
    },
})