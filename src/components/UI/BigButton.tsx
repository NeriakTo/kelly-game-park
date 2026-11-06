import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

// 大按鈕：最少 56 像素高、字 22 像素。主要＝莓果紅白字；次要＝葉綠深字；sun＝向日黃深字（強調）。
// 給 to 就是連結，否則是按鈕。

export type BigButtonVariant = 'primary' | 'secondary' | 'sun'

interface BigButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  readonly variant?: BigButtonVariant
  readonly icon?: ReactNode
  readonly to?: string
  readonly onClick?: () => void
}

export default function BigButton({
  variant = 'primary',
  icon,
  to,
  onClick,
  className = '',
  children,
  type = 'button',
  ...rest
}: BigButtonProps) {
  const cls = `big-btn big-btn--${variant} ${className}`.trim()
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {icon}
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={cls} onClick={onClick} {...rest}>
      {icon}
      {children}
    </button>
  )
}
