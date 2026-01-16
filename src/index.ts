// import * as extensionConfig from '../extension.json';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

export function via(): void {
	eda.sys_Storage.setExtensionUserConfig('page', 'Via');
	eda.sys_IFrame.openIFrame('/vue-dist/index.html', 393.4, 292.8);
}

export function wire(): void {
	eda.sys_Storage.setExtensionUserConfig('page', 'Wire');
	eda.sys_IFrame.openIFrame('/vue-dist/index.html', 385.4, 365.4);
}
