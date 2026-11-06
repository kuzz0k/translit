import { useCallback, useEffect, useRef, useState } from 'react';
import { copyPlainText } from '../lib/clipboard.ts';

export type CopyStatus = 'idle' | 'done' | 'fail';

export interface CopyState {
    status: CopyStatus;
    copy: (text: string) => Promise<boolean>;
}

// Копирует текст и на 1.5 секунды запоминает результат — для надписи на кнопке
export function useCopy(): CopyState {
    const [status, setStatus] = useState<CopyStatus>('idle');
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = useCallback(async (text: string) => {
        if (!text) return false;
        const ok = await copyPlainText(text);
        setStatus(ok ? 'done' : 'fail');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setStatus('idle'), 1500);
        return ok;
    }, []);

    return { status, copy };
}
