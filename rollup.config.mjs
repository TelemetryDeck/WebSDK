import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [
  // minified UMD build for most browsers
  {
    input: 'src/telemetrydeck.mjs',
    output: {
      file: 'dist/telemetrydeck.min.js',
      format: 'umd',
      name: '@telemetrydeck/sdk',
    },
    plugins: [json(), terser()],
  },
];
