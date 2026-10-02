import { RuleTester } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import noTailwindColorUtilities from '../no-tailwind-color-utilities.js';
import noRawColorLiterals from '../no-raw-color-literals.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run('no-tailwind-color-utilities', noTailwindColorUtilities, {
  valid: [
    { code: '<div className="text-[var(--feedback-success)]" />' },
    { code: '<div className="bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)]" />' },
    { code: '<div className="text-transparent" />' },
    { code: '<div className="text-current" />' },
    { code: '<div className="border-2" />' },
    { code: '<div className="bg-opacity-50" />' },
    { code: '<div className="shadow-lg" />' },
    { code: '<div className="border-b" />' },
    { code: '<div className="max-w-2xl" />' },
    { code: '<div className="bg-surface" />' },
  ],
  invalid: [
    {
      code: '<div className="text-emerald-400" />',
      errors: [
        {
          message:
            'Tailwind color utility "text-emerald-400" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
    {
      code: '<div className="bg-amber-500/10" />',
      errors: [
        {
          message:
            'Tailwind color utility "bg-amber-500/10" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
    {
      code: '<div className="border-rose-300" />',
      errors: [
        {
          message:
            'Tailwind color utility "border-rose-300" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
    {
      code: '<div className="hover:text-red-500" />',
      errors: [
        {
          message:
            'Tailwind color utility "hover:text-red-500" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
    {
      code: '<div className="bg-white" />',
      errors: [
        {
          message:
            'Tailwind color utility "bg-white" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
    {
      code: '<div className="text-black" />',
      errors: [
        {
          message:
            'Tailwind color utility "text-black" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
    {
      code: '<div className="from-sky-500" />',
      errors: [
        {
          message:
            'Tailwind color utility "from-sky-500" is not allowed. Use a theme token instead, e.g. text-[var(--feedback-success)].',
        },
      ],
    },
  ],
});

ruleTester.run('no-raw-color-literals', noRawColorLiterals, {
  valid: [
    { code: '<div style={{ backgroundColor: getAvatarColor(name) }} />' },
    { code: '<div style={{ color: "var(--brand-primary)" }} />' },
    { code: 'const color = "#333B46";' },
    { code: '<div className="text-[var(--feedback-success)]" />' },
    { code: '<svg><path fill="#333" /></svg>' },
  ],
  invalid: [
    {
      code: '<div className="text-[#fff]" />',
      errors: [
        {
          message:
            'Raw color literal "#fff" is not allowed. Use a theme token via var(--token).',
        },
      ],
    },
    {
      code: '<div style={{ backgroundColor: "#333B46" }} />',
      errors: [
        {
          message:
            'Raw color literal "#333B46" is not allowed. Use a theme token via var(--token).',
        },
      ],
    },
    {
      code: '<div style={{ border: "1px solid rgba(16,19,24,0.5)" }} />',
      errors: [
        {
          message:
            'Raw color literal "rgba(16,19,24,0.5)" is not allowed. Use a theme token via var(--token).',
        },
      ],
    },
  ],
});
