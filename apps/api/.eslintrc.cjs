module.exports = {
  root: true,
  extends: ["@subzero/eslint-config/nest"],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module"
  },
  ignorePatterns: ["dist/", "node_modules/", ".eslintrc.cjs"]
};
