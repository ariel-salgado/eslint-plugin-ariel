import { TSESTree } from '@typescript-eslint/utils';

import { create_eslint_rule } from '../utils';

export const RULE_NAME = 'prefer-for-of';
export type MessageIds = 'prefer_for_of';
export type Options = [];

interface FuncInfo {
    upper: FuncInfo | null;
    is_target: boolean;
    node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration;
    context_node: TSESTree.Expression | TSESTree.Super | null;
    context_var: any | null;
    return_nodes: TSESTree.ReturnStatement[];
    this_nodes: TSESTree.ThisExpression[];
    can_replace_all_this: boolean;
}

const SENTINEL_TYPE = /(?:Declaration|Statement)$/u;
const MESSAGE = "Expected for-of statement.";

function contains(outer_node: TSESTree.Node, inner_node: TSESTree.Node): boolean {
    return (
        outer_node.range[0] <= inner_node.range[0] &&
        outer_node.range[1] >= inner_node.range[1]
    );
}

function is_callback_of_array_for_each(node: TSESTree.Node): boolean {
    const parent = node.parent;
    return (
        parent?.type === 'CallExpression' &&
        parent.parent?.type === 'ExpressionStatement' &&
        parent.callee.type === 'MemberExpression' &&
        parent.callee.property.type === 'Identifier' &&
        parent.callee.property.name === 'forEach' &&
        parent.arguments.length >= 1 &&
        parent.arguments[0] === node
    );
}

function is_valid_params(node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration): boolean {
    return node.params.length === 1 && node.params[0].type !== 'AssignmentPattern';
}

function is_simple_reference(node: TSESTree.Node): boolean {
    return (
        node.type === 'Identifier' ||
        node.type === 'Literal' ||
        (node.type === 'MemberExpression' &&
            is_simple_reference(node.object) &&
            is_simple_reference(node.property))
        );
    }
    
    function is_called_recursively(context: any, node: TSESTree.Node): boolean {
        const source_code = context.sourceCode ?? context.getSourceCode();
        return (
            'id' in node && node.id != null &&
            source_code.getDeclaredVariables(node)[0].references.length > 0
        );
    }
    
    function is_traversing_array(node: TSESTree.ForStatement): boolean {
        const init = node.init;
        const test = node.test;
        const update = node.update;
        let index_decl: any = null;
        let length_decl: any = null;
        return (
            init != null &&
            init.type === 'VariableDeclaration' &&
            init.kind === 'let' &&
            init.declarations.length >= 1 &&
            (index_decl = init.declarations[0]) &&
            index_decl.id.type === 'Identifier' &&
            index_decl.init != null &&
            index_decl.init.type === 'Literal' &&
            index_decl.init.value === 0 &&
            test != null &&
            test.type === 'BinaryExpression' &&
            test.operator === '<' &&
            test.left.type === 'Identifier' &&
            test.left.name === index_decl.id.name &&
            ((init.declarations.length === 1 &&
                test.right.type === 'MemberExpression' &&
                test.right.property.type === 'Identifier' &&
                test.right.property.name === 'length') ||
                (init.declarations.length === 2 &&
                    (length_decl = init.declarations[1]) &&
                    length_decl.id.type === 'Identifier' &&
                    length_decl.init != null &&
                    length_decl.init.type === 'MemberExpression' &&
                    length_decl.init.property.type === 'Identifier' &&
                    length_decl.init.property.name === 'length' &&
                    test.right.type === 'Identifier' &&
                    test.right.name === length_decl.id.name)) &&
                    update != null &&
                    ((update.type === 'UpdateExpression' &&
                        update.operator === '++' &&
                        update.argument.type === 'Identifier' &&
                        update.argument.name === index_decl.id.name) ||
                        (update.type === 'AssignmentExpression' &&
                            update.operator === '+=' &&
                            update.left.type === 'Identifier' &&
                            update.left.name === index_decl.id.name &&
                            update.right.type === 'Literal' &&
                            update.right.value === 1) ||
                            (update.type === 'AssignmentExpression' &&
                                update.operator === '=' &&
                                update.left.type === 'Identifier' &&
                                update.left.name === index_decl.id.name &&
                                update.right.type === 'BinaryExpression' &&
                                update.right.operator === '+' &&
                                ((update.right.left.type === 'Identifier' &&
                                    update.right.left.name === index_decl.id.name &&
                                    update.right.right.type === 'Literal' &&
                                    update.right.right.value === 1) ||
                                    (update.right.left.type === 'Literal' &&
                                        update.right.left.value === 1 &&
                                        update.right.right.type === 'Identifier' &&
                                        update.right.right.name === index_decl.id.name))))
                                    );
                                }
                                
                                function get_array_text_of_for_statement(source_code: any, node: TSESTree.ForStatement): string {
                                    const init = node.init as TSESTree.VariableDeclaration;
                                    const test = node.test as TSESTree.BinaryExpression;
                                    return init.declarations.length === 2
                                    ? source_code.getText((init.declarations[1].init as TSESTree.MemberExpression).object)
                                    : source_code.getText((test.right as TSESTree.MemberExpression).object);
                                }
                                
                                function is_assignee(start_node: TSESTree.Node): boolean {
                                    let node = start_node;
                                    while (node && node.parent && !SENTINEL_TYPE.test(node.type)) {
                                        const parent = node.parent;
                                        const assignee = (
                                            (parent.type === 'AssignmentExpression' && parent.left === node) ||
                                            (parent.type === 'AssignmentPattern' && parent.left === node) ||
                                            (parent.type === 'VariableDeclarator' && parent.id === node) ||
                                            (parent.type === 'UpdateExpression' && parent.argument === node)
                                        );
                                        if (assignee) return true;
                                        node = parent;
                                    }
                                    return false;
                                }
                                
                                function is_index_var_only_used_to_get_array_elements(context: any, node: TSESTree.ForStatement): boolean {
                                    const source_code = context.sourceCode ?? context.getSourceCode();
                                    const array_text = get_array_text_of_for_statement(source_code, node);
                                    const index_var = source_code.getDeclaredVariables(node.init)[0];
                                    return index_var.references.every((reference: any) => {
                                        const id = reference.identifier;
                                        return (
                                            !contains(node.body, id) ||
                                            (id.parent.type === 'MemberExpression' &&
                                                id.parent.property === id &&
                                                source_code.getText(id.parent.object) === array_text &&
                                                !is_assignee(id.parent))
                                            );
                                        });
                                    }
                                    
                                    function is_length_var_only_used_to_test(context: any, node: TSESTree.ForStatement): boolean {
                                        const init = node.init as TSESTree.VariableDeclaration;
                                        if (init.declarations.length !== 2) return true;
                                        const source_code = context.sourceCode ?? context.getSourceCode();
                                        const length_var = source_code.getDeclaredVariables(init.declarations[1])[0];
                                        return length_var.references.every(
                                            (reference: any) => reference.init || contains(node.test as TSESTree.Node, reference.identifier)
                                        );
                                    }
                                    
                                    function get_variable_by_name(node: TSESTree.Node, context: any, name: string): any {
                                        const source_code = context.sourceCode ?? context.getSourceCode();
                                        const global_scope = source_code.getScope(node);
                                        let scope = global_scope;
                                        while (scope != null) {
                                            const variable = scope.set.get(name);
                                            if (variable != null) return variable;
                                            scope = scope.upper;
                                        }
                                        return null;
                                    }
                                    
                                    function get_context_node(node: TSESTree.Node): TSESTree.Node | null {
                                        const call_node = node.parent as TSESTree.CallExpression;
                                        const context_node = call_node.arguments.length >= 2
                                        ? call_node.arguments[1]
                                        : (call_node.callee as TSESTree.MemberExpression).object;
                                        return is_simple_reference(context_node) ? context_node : null;
                                    }
                                    
                                    function get_context_variable(context: any, context_node: TSESTree.Node): any {
                                        let node = context_node;
                                        while (node.type === 'MemberExpression') {
                                            node = node.object;
                                        }
                                        const source_code = context.sourceCode ?? context.getSourceCode();
                                        const scope = source_code.getScope(node).upper;
                                        return scope.set.get((node as TSESTree.Identifier).name || null);
                                    }
                                    
                                    function get_element_variable_declaration(source_code: any, node: TSESTree.ForStatement): TSESTree.VariableDeclaration | null {
                                        let declaration: any = null;
                                        let declarator: any = null;
                                        const index_text = ((node.test as TSESTree.BinaryExpression).left as TSESTree.Identifier).name;
                                        const array_text = get_array_text_of_for_statement(source_code, node);
                                        const is_element_variable_declaration = (
                                            node.body.type === 'BlockStatement' &&
                                            node.body.body.length > 0 &&
                                            (declaration = node.body.body[0]) &&
                                            declaration.type === 'VariableDeclaration' &&
                                            (declarator = declaration.declarations[0]) &&
                                            declarator.init &&
                                            declarator.init.type === 'MemberExpression' &&
                                            declarator.init.computed &&
                                            declarator.init.property.type === 'Identifier' &&
                                            declarator.init.property.name === index_text &&
                                            source_code.getText(declarator.init.object) === array_text
                                        );
                                        return is_element_variable_declaration ? declaration : null;
                                    }
                                    
                                    function convert_to_fix(replace_text: string, offset: number, node: TSESTree.Node): any {
                                        return {
                                            range: [node.range[0] - offset, node.range[1] - offset],
                                            text: replace_text,
                                        };
                                    }
                                    
                                    function apply_fixes(original_text: string, fixes: any[]): string {
                                        let text = '';
                                        let last_pos = 0;
                                        fixes.sort((a, b) => a.range[0] - b.range[0]);
                                        for (const fix of fixes) {
                                            text += original_text.slice(last_pos, fix.range[0]);
                                            text += fix.text;
                                            last_pos = fix.range[1];
                                        }
                                        text += original_text.slice(last_pos);
                                        return text;
                                    }
                                    
                                    function fix_array_for_each(context: any, callback_info: FuncInfo, fixer: any): any {
                                        const source_code = context.sourceCode ?? context.getSourceCode();
                                        const func_node = callback_info.node;
                                        const call_node = func_node.parent as TSESTree.CallExpression;
                                        const callee_node = call_node.callee as TSESTree.MemberExpression;
                                        const return_nodes = callback_info.return_nodes;
                                        const this_nodes = callback_info.this_nodes;
                                        const context_node = callback_info.context_node;
                                        const can_replace_all_this = callback_info.can_replace_all_this;
                                        if (callee_node.loc.start.line !== callee_node.loc.end.line) return null;
                                        if (this_nodes.length > 0 && !can_replace_all_this) return null;
                                        const array_text = source_code.getText(callee_node.object);
                                        const element_text = source_code.getText(func_node.params[0]);
                                        const original_body_text = source_code.getText(func_node.body);
                                        const context_text = context_node && source_code.getText(context_node);
                                        const semi_text = func_node.body.type !== 'BlockStatement' ? ';' : '';
                                        const body_offset = func_node.body.range[0];
                                        const body_fixes = [
                                            ...return_nodes.map(convert_to_fix.bind(null, 'continue;', body_offset)),
                                            ...this_nodes.map(convert_to_fix.bind(null, context_text, body_offset))
                                        ];
                                        const body_text = body_fixes.length > 0
                                        ? apply_fixes(original_body_text, body_fixes)
                                        : original_body_text;
                                        return fixer.replaceText(
                                            call_node.parent,
                                            `for (let ${element_text} of ${array_text}) ${body_text}${semi_text}`
                                        );
                                    }
                                    
                                    function fix_for_statement(context: any, node: TSESTree.ForStatement, fixer: any): any {
                                        const source_code = context.sourceCode ?? context.getSourceCode();
                                        const element = get_element_variable_declaration(source_code, node);
                                        if (element == null || !is_length_var_only_used_to_test(context, node)) {
                                            return null;
                                        }
                                        const array_text = get_array_text_of_for_statement(source_code, node);
                                        const element_text = source_code.getText(element.declarations[0].id);
                                        return fixer.replaceTextRange(
                                            [node.range[0], element.range[1]],
                                            `for (let ${element_text} of ${array_text}) {`
                                        );
                                    }
                                    
                                    export default create_eslint_rule<Options, MessageIds>({
                                        name: RULE_NAME,
                                        meta: {
                                            type: 'suggestion',
                                            docs: {
                                                description: 'requires for-of statements instead of Array#forEach',
                                            },
                                            fixable: 'code',
                                            schema: [],
                                            messages: {
                                                prefer_for_of: MESSAGE,
                                            },
                                        },
                                        defaultOptions: [],
                                        create(context) {
                                            let func_info: FuncInfo | null = null;
                                            
                                            function enter_function(node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration) {
                                                const is_target = (
                                                    is_callback_of_array_for_each(node) &&
                                                    is_valid_params(node) &&
                                                    !is_called_recursively(context, node)
                                                );
                                                const context_node = is_target ? get_context_node(node) : null;
                                                const context_var = context_node && get_context_variable(context, context_node);
                                                func_info = {
                                                    upper: func_info,
                                                    is_target,
                                                    node,
                                                    context_node: context_node as TSESTree.FunctionExpression,
                                                    context_var,
                                                    return_nodes: [],
                                                    this_nodes: [],
                                                    can_replace_all_this: context_var != null,
                                                };
                                            }
                                            
                                            function exit_function() {
                                                if (func_info!.is_target) {
                                                    const expression_statement_node = func_info!.node.parent!.parent;
                                                    context.report({
                                                        node: expression_statement_node!,
                                                        messageId: 'prefer_for_of',
                                                        fix: fix_array_for_each.bind(null, context, func_info!),
                                                    });
                                                }
                                                func_info = func_info!.upper;
                                            }
                                            
                                            return {
                                                ArrowFunctionExpression: enter_function,
                                                FunctionExpression: enter_function,
                                                FunctionDeclaration: enter_function,
                                                'ArrowFunctionExpression:exit': exit_function,
                                                'FunctionExpression:exit': exit_function,
                                                'FunctionDeclaration:exit': exit_function,
                                                ReturnStatement(node: TSESTree.ReturnStatement) {
                                                    if (func_info != null && func_info.is_target) {
                                                        func_info.return_nodes.push(node);
                                                    }
                                                },
                                                ThisExpression(node: TSESTree.ThisExpression) {
                                                    let this_func_info = func_info;
                                                    while (
                                                        this_func_info != null &&
                                                        this_func_info.node.type === 'ArrowFunctionExpression'
                                                    ) {
                                                        this_func_info = this_func_info.upper;
                                                    }
                                                    if (
                                                        this_func_info != null &&
                                                        this_func_info.is_target &&
                                                        !this_func_info.return_nodes.some(return_node => contains(return_node, node))
                                                    ) {
                                                        this_func_info.this_nodes.push(node);
                                                        if (this_func_info.can_replace_all_this) {
                                                            if (this_func_info.context_var != null) {
                                                                const variable = get_variable_by_name(
                                                                    node,
                                                                    context,
                                                                    this_func_info.context_var.name
                                                                );
                                                                this_func_info.can_replace_all_this = variable === this_func_info.context_var;
                                                            }
                                                        }
                                                    }
                                                },
                                                'ForStatement:exit'(node: TSESTree.ForStatement) {
                                                    if (
                                                        is_traversing_array(node) &&
                                                        is_index_var_only_used_to_get_array_elements(context, node)
                                                    ) {
                                                        context.report({
                                                            node,
                                                            messageId: 'prefer_for_of',
                                                            fix: fix_for_statement.bind(null, context, node),
                                                        });
                                                    }
                                                },
                                                ForInStatement(node: TSESTree.ForInStatement) {
                                                    context.report({ node, messageId: 'prefer_for_of' });
                                                },
                                            };
                                        },
                                    });