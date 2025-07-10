import { create_eslint_rule } from '../utils'

export const RULE_NAME = 'top-level-function'
export type MessageIds = 'topLevelFunctionDeclaration'
export type Options = []

export default create_eslint_rule<Options, MessageIds>({
    name: RULE_NAME,
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce top-level functions to be declared with function keyword',
        },
        fixable: 'code',
        schema: [],
        messages: {
            topLevelFunctionDeclaration: 'Top-level functions should be declared with function keyword',
        },
    },
    defaultOptions: [],
    create: (context) => {
        return {
            VariableDeclaration(node) {
                if (node.parent.type !== 'Program' && node.parent.type !== 'ExportNamedDeclaration')
                    return
                
                if (node.declarations.length !== 1)
                    return
                if (node.kind !== 'const')
                    return
                if (node.declare)
                    return
                
                const declaration = node.declarations[0]
                
                if (
                    declaration.init?.type !== 'ArrowFunctionExpression'
                    && declaration.init?.type !== 'FunctionExpression'
                ) {
                    return
                }
                if (declaration.id?.type !== 'Identifier')
                    return
                if (declaration.id.typeAnnotation)
                    return
                if (
                    declaration.init.body.type !== 'BlockStatement'
                    && declaration.id?.loc.start.line === declaration.init?.body.loc.end.line
                ) {
                    return
                }
                
                const fn = declaration.init
                const body = declaration.init.body
                const id = declaration.id
                
                context.report({
                    node,
                    loc: {
                        start: id.loc.start,
                        end: body.loc.start,
                    },
                    messageId: 'topLevelFunctionDeclaration',
                    fix(fixer) {
                        const code = context.sourceCode.text
                        const text_name = code.slice(id.range[0], id.range[1])
                        const text_args = fn.params.length
                        ? code.slice(fn.params[0].range[0], fn.params[fn.params.length - 1].range[1])
                        : ''
                        const text_body = body.type === 'BlockStatement'
                        ? code.slice(body.range[0], body.range[1])
                        : `{\n  return ${code.slice(body.range[0], body.range[1])}\n}`
                        const text_generic = fn.typeParameters
                        ? code.slice(fn.typeParameters.range[0], fn.typeParameters.range[1])
                        : ''
                        const text_type_return = fn.returnType
                        ? code.slice(fn.returnType.range[0], fn.returnType.range[1])
                        : ''
                        const text_async = fn.async ? 'async ' : ''
                        
                        const final = `${text_async}function ${text_name} ${text_generic}(${text_args})${text_type_return} ${text_body}`
                        return fixer.replaceTextRange([node.range[0], node.range[1]], final)
                    },
                })
            },
        }
    },
})