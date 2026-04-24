// 확인 다이얼로그 → Server Action 호출 범용 버튼
"use client";

import { useTransition } from "react";

type Props = {
  action: () => Promise<unknown>;
  confirmMessage: string;
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  icon?: string;
};

export default function ConfirmButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
  className,
  disabled,
  icon,
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      await action();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      className={className}
    >
      {icon && (
        <span className="material-symbols-outlined text-[18px] mr-1">{icon}</span>
      )}
      {pending ? pendingLabel ?? "처리 중..." : label}
    </button>
  );
}
