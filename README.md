# console-colorizer

Adds colored console logging (for node and browser) and it makes colored
console compatible with both terminal *and* browser.

Example:

```js
require('console-colorizer')(console);

console.log('%cSome message here\n', 'bold hsla(120, 100%, 30%, 0.8)', { a: 1, b: 2, c: [ 3, 4, 5 ] });
```

The above will output a colored message to the console using ansi colors
in the terminal and colors in the browser.

## Caveats

This module doesn't support '%o'
