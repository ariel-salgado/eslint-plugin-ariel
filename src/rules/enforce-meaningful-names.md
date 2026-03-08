# enforce-meaningful-names

Enforce meaningful variable, function, property, and parameter names to improve readability and maintainability.

## Rule Details

This rule ensures identifiers clearly convey intent. It prevents generic, overly short, or confusing names that reduce code clarity.

<!-- eslint-skip -->
~~~js
// 👎 bad — short or generic names
function fn(d) {
  const val = process(d);
  const temp = calculate(val);
  return temp;
}
~~~

<!-- eslint-skip -->
~~~js
// 👎 bad — meaningless names
let foo = getData();
let bar = foo.filter(x => x.active);
~~~

<!-- eslint-skip -->
~~~js
// 👎 bad — single letters (non-conventional)
function process(a, b, c) {
  return a + b + c;
}
~~~

<!-- eslint-skip -->
~~~js
// 👍 good — meaningful names
function processUserData(userData) {
  const processedData = transform(userData);
  const calculatedResult = calculate(processedData);
  return calculatedResult;
}
~~~

<!-- eslint-skip -->
~~~js
// 👍 good — descriptive identifiers
let users = getUserList();
let activeUsers = users.filter(user => user.isActive);
~~~

<!-- eslint-skip -->
~~~js
// 👍 good — clear parameter names
function calculateTotal(price, taxRate, discountAmount) {
  return price * (1 + taxRate) - discountAmount;
}
~~~

<!-- eslint-skip -->
~~~js
// 👍 good — conventionally allowed short names
for (let i = 0; i < items.length; i++) {}

const point = { x: 10, y: 20 }; // coordinates
~~~

The rule checks:
- Function names
- Function parameters
- Variable names
- Object property keys (non-computed)

## Options

This rule accepts a single configuration object.

### minLength

Minimum identifier length.

Default: `2`

<!-- eslint-skip -->
~~~js
// minLength: 3
const id = 1;     // 👎 too short
const userId = 1; // 👍 ok
~~~

### allowedNames

Identifiers allowed even if shorter than `minLength` or otherwise non-meaningful.

Default: `['i', 'j', 'k', 'x', 'y', 'z']`

<!-- eslint-skip -->
~~~js
// allowedNames: ['i', 'j', 'x', 'y']
for (let i = 0; i < 10; i++) {} // 👍 ok
const point = { x: 0, y: 0 };   // 👍 ok
~~~

### disallowedNames

Identifiers that are always disallowed.

Default: `['temp', 'tmp', 'foo', 'bar', 'baz']`

<!-- eslint-skip -->
~~~js
// disallowedNames: ['temp', 'foo', 'bar']
let temp = getValue();   // 👎 disallowed
let foo = getData();     // 👎 disallowed
let result = getValue(); // 👍 ok
~~~

## Examples

### Default Configuration

~~~js
export default [
	{
		rules: {
			'code-complete/enforce-meaningful-names': 'error',
		},
	},
];
~~~

### Custom Configuration

~~~js
export default [
	{
		rules: {
			'code-complete/enforce-meaningful-names': ['error', {
				minLength: 3,
				allowedNames: ['i', 'j', 'k', 'x', 'y', 'z', 'id', 'db'],
				disallowedNames: ['temp', 'tmp', 'foo', 'bar', 'baz', 'test', 'data'],
			}],
		},
	},
];
~~~

## When Not To Use It

- Codebases where short identifiers are an established convention
- Mathematical or algorithm-heavy code where single-letter variables are standard
- Generated code or integrations requiring fixed naming patterns
