import * as bootstrap from 'bootstrap';

export function openModal(modalId: string) {
  const el = document.getElementById(modalId);
  if (!el) return;
  const instance = bootstrap.Modal.getOrCreateInstance(el);
  instance.show();
}

export function closeModal(modalId: string) {
  const el = document.getElementById(modalId);
  if (!el) return;
  const instance = bootstrap.Modal.getInstance(el) || bootstrap.Modal.getOrCreateInstance(el);
  instance.hide();
}
