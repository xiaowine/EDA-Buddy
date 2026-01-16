/**
 * EDA Buddy: Buck 电感参数计算
 * @param vin - 输入电压 (V)
 * @param vout - 输出电压 (V)
 * @param iout - 输出电流 (A)
 * @param freq - 开关频率 (Hz, 例如 300kHz 则输入 300000)
 * @param ripplePct - 纹波系数 (通常取 0.2 ~ 0.4，即 20%~40%)
 */
export const calcBuckInductor = (vin: number, vout: number, iout: number, freq: number, ripplePct: number) => {
	// Validate inputs
	if (vin <= 0 || vout <= 0 || freq <= 0 || ripplePct <= 0) {
		return {
			inductance_uH: NaN,
			peakCurrent_A: NaN,
			ratedCurrent_A: NaN,
			avgCurrent_A: NaN,
			mode: 'invalid',
		} as any;
	}

	// Decide topology: buck if Vout <= Vin, otherwise boost
	if (vout <= vin) {
		// Buck converter
		const mode = 'buck';
		const D = vout / vin;
		const deltaI = iout * ripplePct;
		const L_min = (vout * (1 - D)) / (freq * deltaI);
		const iPeak = iout + deltaI / 2;
		const iRated = iPeak * 1.25;

		return {
			mode,
			inductance_uH: L_min * 1000000,
			peakCurrent_A: iPeak,
			ratedCurrent_A: iRated,
			avgCurrent_A: iout,
		};
	} else {
		// Boost converter
		const mode = 'boost';
		// Duty cycle for ideal boost: D = 1 - Vin/Vout
		const D = 1 - vin / vout;
		// Average inductor/input current (ideal) = Iin = (Vout/Vin) * Iout
		const iIn = (vout / vin) * iout;
		const deltaI = iIn * ripplePct;
		// For boost: L = Vin * D / (f * deltaI)
		const L_min = (vin * D) / (freq * deltaI);
		const iPeak = iIn + deltaI / 2;
		const iRated = iPeak * 1.25;

		return {
			mode,
			inductance_uH: L_min * 1000000,
			peakCurrent_A: iPeak,
			ratedCurrent_A: iRated,
			avgCurrent_A: iIn,
		};
	}
};
