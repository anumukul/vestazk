declare module "bun" {
  // Minimal typing for Bun's $ tagged template.
  export const $: any;
}

// Global Bun object used by Bun.serve()
declare const Bun: any;
