import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // The migration brief (Task 6M) keeps plain <img> tags on purpose: this
      // is a framework migration with no visual changes, and next/image
      // changes layout/loading behaviour. Re-enable once images are revisited.
      '@next/next/no-img-element': 'off',
    },
  },
];

export default eslintConfig;
