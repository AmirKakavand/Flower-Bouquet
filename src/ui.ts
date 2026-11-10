import { isSoundEnabled, toggleSound, playSproutChime } from './audio';

let toastTimer: number | undefined;

export function showToast(msg: string, icon = "🌸"): void {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const textEl = document.getElementById('toast-text');
    const iconEl = document.getElementById('toast-icon');
    if (textEl) textEl.innerText = msg;
    if (iconEl) iconEl.innerText = icon;

    toast.classList.remove('opacity-0', '-translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-4');
    }, 2400);
}

export function setupUI(
    onBloom: () => void,
    onWater: () => void,
    onToggleTheme: () => void
): void {
    const noteModal = document.getElementById('note-modal');
    const modalBox = document.getElementById('modal-box');
    const letterBtn = document.getElementById('letter-btn');
    const bloomBtn = document.getElementById('bloom-btn');
    const waterBtn = document.getElementById('water-btn');
    const soundBtn = document.getElementById('sound-btn');
    const themeBtn = document.getElementById('theme-btn');
    const copyNoteBtn = document.getElementById('copy-note-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cornerCloseBtn = document.getElementById('corner-close-btn');

    function openNoteModal(): void {
        if (!noteModal || !modalBox) return;
        noteModal.classList.remove('pointer-events-none');
        noteModal.classList.add('opacity-100');
        modalBox.classList.remove('modal-enter');
        modalBox.classList.add('modal-active');
        playSproutChime();
    }

    function closeNoteModal(): void {
        if (!noteModal || !modalBox) return;
        noteModal.classList.add('pointer-events-none');
        noteModal.classList.remove('opacity-100');
        modalBox.classList.remove('modal-active');
        modalBox.classList.add('modal-enter');
    }

    letterBtn?.addEventListener('click', openNoteModal);
    closeModalBtn?.addEventListener('click', closeNoteModal);
    cornerCloseBtn?.addEventListener('click', closeNoteModal);
    bloomBtn?.addEventListener('click', onBloom);
    waterBtn?.addEventListener('click', onWater);
    themeBtn?.addEventListener('click', onToggleTheme);

    soundBtn?.addEventListener('click', () => {
        const enabled = toggleSound();
        document.getElementById('sound-icon-on')?.classList.toggle('hidden', !enabled);
        document.getElementById('sound-icon-off')?.classList.toggle('hidden', enabled);
        showToast(enabled ? "Audio chimes active" : "Audio muted", enabled ? "🔔" : "🔕");
    });

    copyNoteBtn?.addEventListener('click', () => {
        const noteContent = "Specially cultivated for Mahdis — a tiny, zero-water desk plant guaranteed not to wilt. Hope it brought a smile to your day!";
        const el = document.createElement('textarea');
        el.value = noteContent;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);

        const copyLabel = document.getElementById('copy-text');
        if (copyLabel) copyLabel.innerText = "Copied to Clipboard!";
        setTimeout(() => {
            if (copyLabel) copyLabel.innerText = "Copy Sweet Note";
        }, 2000);
        showToast("Note copied to clipboard!", "💌");
    });
}

export function hideInstruction(): void {
    const pill = document.getElementById('instruction-pill');
    if (pill) {
        pill.style.opacity = '0';
        setTimeout(() => pill.remove(), 700);
    }
}