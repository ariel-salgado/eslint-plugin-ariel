# prefer-for-of

Requires `for-of` statements instead of `Array#forEach`.

## Rule Details

<!-- eslint-skip -->
```js
// 👎 bad
list.forEach(value => {
  doSomething(value)
})

for (let i = 0; i < list.length; ++i) {
  const value = list[i]
  doSomething(value)
}

for (const i in list) {
  if (obj.hasOwnProperty(i)) {
    doSomething(obj[i])
  }
}

for (const key in obj) {
  doSomething(key, obj[key])
}
```

<!-- eslint-skip -->
```js
// 👍 good
for (const value of list) {
  doSomething(value)
}

for (const key of Object.keys(obj)) {
  doSomething(key, obj[key])
}
```

This rule also suggests a fix  to automatically convert Array#forEach and traditional for loops into for-of loops when applicable.
