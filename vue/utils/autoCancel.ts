// 简单的自动取消计时器工具，保证 cleanup 只会在超时触发时运行一次
export function createAutoCancel(cleanup: () => Promise<void> | void, timeoutMs = 20000) {
	let timer: number | null = null;
	let fired = false;

	const start = () => {
		if (timer !== null) return;
		// window.setTimeout 在浏览器中返回 number
		timer = window.setTimeout(async () => {
			if (fired) return;
			fired = true;
			try {
				await cleanup();
			} catch (e) {
				// swallow
				console.error('autoCancel cleanup error', e);
			}
			timer = null;
		}, timeoutMs) as unknown as number;
	};

	const cancel = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		fired = true; // prevent delayed cleanup
	};

	return { start, cancel };
}
