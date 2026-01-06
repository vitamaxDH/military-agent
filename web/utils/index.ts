export const calculateDDay = (deadlineStr: string): number | null => {
    if (!deadlineStr) return null;
    if (deadlineStr.includes("오늘마감")) return 0;
    if (deadlineStr.includes("채용시") || deadlineStr.includes("상시")) return 999;

    const match = deadlineStr.match(/(\d{2})\/(\d{2})/);
    if (match) {
        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);

        const now = new Date();
        const currentYear = now.getFullYear();
        let targetDate = new Date(currentYear, month - 1, day);

        if (targetDate < now && (now.getMonth() > month)) {
            targetDate.setFullYear(currentYear + 1);
        }

        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return null;
};
