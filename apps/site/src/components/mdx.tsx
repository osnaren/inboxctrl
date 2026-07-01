import defaultMdxComponents from 'fumadocs-ui/mdx';

import { Callout } from '@/components/mdx/callout';
import { Card, Cards } from '@/components/mdx/cards';
import { Pre } from '@/components/mdx/pre';
import { Step, Steps } from '@/components/mdx/steps';

import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout,
    Card,
    Cards,
    Step,
    Steps,
    pre: Pre,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
