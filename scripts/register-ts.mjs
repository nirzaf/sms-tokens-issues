// Node's native TypeScript support intentionally requires ESM extensions.
// Match Vite's extensionless relative imports without changing test code.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND' &&
          /^\.\.?(?:\/)/.test(specifier) && !/\.[a-z]+$/i.test(specifier)) {
        return nextResolve(specifier + '.ts', context);
      }
      throw error;
    }
  },
});
