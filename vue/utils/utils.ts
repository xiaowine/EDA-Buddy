/** 常量：单位换算 */
export const MIL_TO_MM = 0.0254; // 1 mil = 0.0254 mm
export const MM_TO_MIL = 39.37007874015748; // 1 mm = 39.37007874015748 mil
export const isEDA = typeof window !== 'undefined' && (window as any).eda !== undefined;

const getCurrentDocumentType = async () => {
	if (!isEDA) return null;
	const info = await eda.dmt_SelectControl.getCurrentDocumentInfo();
	return info?.documentType;
};

export const isSCH = async () => {
	const docType = await getCurrentDocumentType();
	return docType === EDMT_EditorDocumentType.SCHEMATIC_PAGE;
};

export const isPCB = async () => {
	const docType = await getCurrentDocumentType();
	return docType === EDMT_EditorDocumentType.PCB;
};
