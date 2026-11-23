import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// eslint-config-next@16 mengekspor flat config ESLint 9 langsung
// (sudah termasuk ignores untuk .next/, out/, build/, next-env.d.ts).
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // Aturan baru react-hooks v6 (era React Compiler): menandai pola
      // setState-in-effect yang sudah ada di 13 komponen (beban render, bukan
      // kebenaran). Diturunkan jadi warning; refactor menyusul.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
