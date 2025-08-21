/// <reference types="vite/client" />

// Declaração para módulos CSS e SCSS
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// Declaração para outros arquivos de estilo
declare module '*.css' {
  const css: string;
  export default css;
}

declare module '*.scss' {
  const css: string;
  export default css;
}

declare module '*.sass' {
  const css: string;
  export default css;
}