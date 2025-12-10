import { ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export const Modal = ({ open, title, onClose, children, footer }: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="card w-full max-w-2xl border border-white/10 shadow-2xl shadow-primary/30">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-light">Norax Credentials</p>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost h-10 w-10 rounded-full border border-white/10 p-0 text-lg"
            aria-label="Kapat"
          >
            <IoClose />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
        {footer ? <div className="border-t border-white/5 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
};
