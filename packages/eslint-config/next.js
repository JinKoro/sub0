/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base.js', 'next/core-web-vitals', 'prettier'],
  env: {
    browser: true,
    node: true,
  },
};
