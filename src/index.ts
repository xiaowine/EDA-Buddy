// import * as extensionConfig from '../extension.json';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

const openPage = (name: string, width: number, height: number) => {
	eda.sys_Storage.setExtensionUserConfig('page', name);
	eda.sys_IFrame.openIFrame('/vue-dist/index.html', width, height);
};

export function via(): void {
	openPage('Via', 393.4, 308.7);
}

export function wire(): void {
	openPage('Wire', 385.4, 383.4);
}
export function inductor(): void {
	openPage('Inductor', 393.4, 421.4);
}
export function diffPair(): void {
	openPage('DiffPair', 733.4, 382.7);
}

export function vDivision(): void {
	openPage('VDivision', 633.4, 413.4);
}
