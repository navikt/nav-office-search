/// <reference types="vite/client" />

declare module '*.module.css' {
	const classes: { [key: string]: string };
	export default classes;
}

declare global {
	interface ImportMetaEnv {
		readonly VITE_APP_BASEPATH: string;
		readonly VITE_APP_ORIGIN: string;
		readonly VITE_NAVNO_ORIGIN: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
