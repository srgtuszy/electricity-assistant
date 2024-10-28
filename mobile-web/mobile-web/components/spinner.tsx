import React from 'react'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  let spinnerSizeClass = ''

  switch (size) {
    case 'sm':
      spinnerSizeClass = 'h-4 w-4'
      break
    case 'lg':
      spinnerSizeClass = 'h-12 w-12'
      break
    case 'md':
    default:
      spinnerSizeClass = 'h-8 w-8'
      break
  }

  return (
    <svg
      className={`animate-spin text-gray-500 ${spinnerSizeClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  )
}
