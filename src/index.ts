/*
 * Dubalu Framework
 * ~~~~~~~~~~~~~~~~
 *
 * :author: Dubalu Framework Team. See AUTHORS.
 * :copyright: Copyright (c) 2017-2018, deipi.com LLC. All Rights Reserved.
 * :license: See LICENSE for more details.
 *
 */

// rgb(0, 136, 255)
// rgb(68, 136, 68)
// rgb(255, 68, 0)
// rgb(255, 34, 0)

// require('console-colorizer').consoleColorizer(console);
// console.error('🔥  %cSome message here\n', 'rgb(255, 34, 0)', { a: 1, b: 2, c: [ 3, 4, 5 ] });
// console.info('%cSome message here', console.rgb(0, 136, 255));

import * as colorName from 'color-name';

interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

const colors_re = RegExp(`\
\\b(${Object.keys(colorName).join('|')})\\b\
|\
#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])\\b\
|\
#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})\\b\
|\
\\brgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)\
|\
\\brgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+|\\d*\\.\\d+)\\s*\\)\
|\
\\bhsl\\(\\s*(\\d+|\\d*\\.\\d+)\\s*,\\s*(\\d+|\\d*\\.\\d+)%\\s*,\\s*(\\d+|\\d*\\.\\d+)%\\s*\\)\
|\
\\bhsla\\(\\s*(\\d+|\\d*\\.\\d+)\\s*,\\s*(\\d+|\\d*\\.\\d+)%\\s*,\\s*(\\d+|\\d*\\.\\d+)%\\s*,\\s*(\\d+|\\d*\\.\\d+)\\s*\\)\
`);

export const hsla = (hue: number, saturation: number, lightness: number, alpha: number): Color => {
  var h = hue / 360;
  var s = saturation / 100;
  var l = lightness / 100;
  var r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    var hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    red: Math.round(r * 255),
    green: Math.round(g * 255),
    blue: Math.round(b * 255),
    alpha,
  };
};

export const hsl = (hue: number, saturation: number, lightness: number): Color => hsla(hue, saturation, lightness, 1);

export const rgba = (red: number, green: number, blue: number, alpha: number): Color => ({ red, green, blue, alpha: alpha });

export const rgb = (red: number, green: number, blue: number): Color => rgba(red, green, blue, 1);

const ansi = (color: Color, bold?: boolean) =>
  `\x1b[${bold ? 1 : 0};38;2;${Math.round(color.red * color.alpha)};${Math.round(
    color.green * color.alpha,
  )};${Math.round(color.blue * color.alpha)}m`;

const css = (color: Color, bold?: boolean) =>
  `${bold ? 'font-weight:bold;' : ''}color:rgba(${color.red},${color.green},${color.blue},${
    color.alpha
  });`;

const bClear = length => {
  const b = '\b'.repeat(length);
  const s = ' '.repeat(length);
  return `${b}${s}${b}`;
};

const normalizeColor = (color: string | Color) => {
  let bold = false;
  let out: Color;
  if (typeof color === 'string') {
    bold = /\bbold\b/.test(color);
    const match = color.match(colors_re);
    if (match) {
      if (match[1]) {
        const [red, green, blue] = colorName[match[1]];
        out = rgb(red, green, blue);
      } else {
        const base = match[5] || match[2] ? 16 : 10;
        const fn = match[18] || match[15] ? hsla : rgba;
        const red_hue = parseInt(
          match[18] || match[15] || match[11] || match[8] || match[5] || match[2].repeat(2),
          base,
        );
        const green_saturation = parseInt(
          match[19] || match[16] || match[12] || match[9] || match[6] || match[3].repeat(2),
          base,
        );
        const blue_lightness = parseInt(
          match[20] || match[17] || match[13] || match[10] || match[7] || match[4].repeat(2),
          base,
        );
        const alpha = parseFloat(match[21] || match[14] || '1.0');
        out = fn(red_hue, green_saturation, blue_lightness, alpha);
      }
    } else {
      out = rgb(127, 127, 127);
    }
  }

  if (!color) {
    out = rgb(127, 127, 127);
  }

  return {
    color: out,
    bold,
  };
};

const cssFont0 = 'font-size:0;';
const cssFont1 = 'font-size:1;';
const ansiClear = '\x1b[m';

interface ColorizedConsole extends Console {
  __colorized: true;
  rgb(red: number, green: number, blue: number): Color;
  rgba(red: number, green: number, blue: number, alpha: number): Color;
  hsl(hue: number, saturation: number, lightness: number): Color;
  hsla(hue: number, saturation: number, lightness: number, alpha: number): Color;
};

export const consoleColorizer = (c?: Console): ColorizedConsole => {
  const colored = (c || {}) as ColorizedConsole;
  if (colored.__colorized) {
    return colored;
  }
  const _console = {};
  const colored_console = (level, message, ...params) => {
    if (typeof message !== 'undefined' && params.length) {
      const args = [];
      const objs = [];
      let lastColor = null;
      message = message.replace(/%(?:([-])?(\d+|\*)?(?:\.(\d+|\*))?([disfbxejcoO%]))/g, (match, flags, width, precision, specifier) => {
        const param = params.shift();
        if (specifier === 'c') {
          const {color, bold} = normalizeColor(param);
          lastColor = color;
          const ansiFont = ansi(color, bold);
          const cssFont = css(color, bold);
          args.push(cssFont0);
          args.push(`${cssFont}/*${bClear(cssFont0.length + cssFont.length + 4)}\x1b[K*/${bClear(2)}`);
          return `%c\b\b${ansiFont}%c\b\b`;
        } else if (specifier === 'o' || specifier === 'O') {
          objs.push(param);
          return '';
        }
        return param;
      });
      if (lastColor && !message.endsWith('\b\b')) {
        const color = rgba(lastColor.red, lastColor.green, lastColor.blue, lastColor.alpha * 0.6);
        const ansiFont = ansi(color);
        const cssFont = css(color);
        args.push(cssFont0);
        args.push(`${cssFont}/*${bClear(cssFont0.length + cssFont.length + 4)}\x1b[K*/${bClear(2)}`);
        message += `%c\b\b${ansiFont}%c\b\b`;
      }
      objs.push(...params);
      _console[level](
        `%c\b\b${ansiClear}%c\b\b${message}`,
        `${cssFont0}${bClear(cssFont0.length + 1)}`,
        `${cssFont1}${bClear(cssFont1.length + 1)}`,
        ...args,
        ...objs,
      );
    } else {
      _console[level](message, ...params);
    }
  };
  for (const level of Object.keys(console)) {
    _console[level] = console[level];
    colored[level] = colored_console.bind(null, level);
  }
  colored.hsl = hsl;
  colored.hsla = hsla;
  colored.rgb = rgb;
  colored.rgba = rgba;
  colored.__colorized = true;
  return colored;
}

export default consoleColorizer;
